import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderAccountEntity, ProviderMembershipEntity } from "./provider.entity";
import { publishOffer, publicOfferId } from "./provider-offer-publication";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { defaultOfferConfiguration, offerConfiguration, offerInput } from "./provider-offers.input";

const storedConfiguration = (row: ProviderOfferEntity) => row.configuration && Object.keys(row.configuration).length > 0 ? offerConfiguration(row.configuration) : defaultOfferConfiguration();
const offerView = (row: ProviderOfferEntity) => ({ id: row.id, publicProfileId: row.status === "published" ? publicOfferId(row.id) : null, title: row.title, category: row.category, description: row.description, priceMinor: row.priceMinor, durationMinutes: row.durationMinutes, configuration: storedConfiguration(row), status: row.status, revision: row.revision });
@Injectable()
export class ProviderOffersService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>,
    @InjectRepository(ProviderOfferEntity) private readonly offers: Repository<ProviderOfferEntity>) {}
  private async accountId(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOneBy({ userId: user.id });
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do usług działalności.");
    return membership.accountId;
  }
  async list(authorization?: string) {
    const accountId = await this.accountId(authorization);
    return (await this.offers.find({ where: { accountId }, order: { title: "ASC", id: "ASC" } })).map(offerView);
  }
  async get(authorization: string | undefined, id: string) {
    const accountId = await this.accountId(authorization);
    const offer = await this.offers.findOneBy({ id, accountId });
    if (!offer) throw new NotFoundException("Nie znaleziono usługi.");
    return offerView(offer);
  }
  async create(authorization: string | undefined, value: unknown) {
    const accountId = await this.accountId(authorization);
    const input = offerInput(value);
    return offerView(await this.offers.save(this.offers.create({ ...input, accountId, revision: 1 })));
  }
  async update(authorization: string | undefined, id: string, value: unknown) {
    const accountId = await this.accountId(authorization);
    const { revision, ...input } = offerInput(value, true);
    const existing = await this.offers.findOneBy({ id, accountId });
    if (!existing) throw new NotFoundException("Nie znaleziono usługi.");
    if (input.status === "published" || existing.status === "published") {
      return this.offers.manager.transaction(async manager => {
        const account = await manager.findOne(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
        if (!account) throw new NotFoundException("Nie znaleziono działalności.");
        const current = await manager.findOne(ProviderOfferEntity, { where: { id, accountId }, lock: { mode: "pessimistic_write" } });
        if (!current) throw new NotFoundException("Nie znaleziono usługi.");
        if (current.revision !== revision) throw new ConflictException("Dane usługi zmieniły się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
        const next = manager.create(ProviderOfferEntity, { ...current, ...input, revision: revision! + 1 });
        await publishOffer(manager, next, account);
        return offerView(await manager.save(ProviderOfferEntity, next));
      });
    }
    const nextRevision = revision! + 1;
    const result = await this.offers.update({ id, accountId, revision }, { ...input, revision: nextRevision });
    if (result.affected !== 1) throw new ConflictException("Dane usługi zmieniły się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
    return offerView({ ...existing, ...input, revision: nextRevision });
  }
}

