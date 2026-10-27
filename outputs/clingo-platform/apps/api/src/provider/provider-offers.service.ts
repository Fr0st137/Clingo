import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type sharpFactory from "sharp";
const sharp: typeof sharpFactory = require("sharp");
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService, objectInput } from "../auth/auth.service";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";
import { publishOffer, publicOfferId } from "./provider-offer-publication";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { defaultOfferConfiguration, offerConfiguration, offerInput, type OfferConfiguration } from "./provider-offers.input";
import { assertOfferStaffing, staffingLimit } from "./provider-staffing";

async function validatePresentation(presentation: OfferConfiguration["presentation"]) {
  if (!presentation) return;
  try {
    for (const image of [presentation.banner, ...presentation.gallery].filter((value): value is string => !!value)) {
      const source = sharp(Buffer.from(image.split(",")[1], "base64"), { limitInputPixels: 12000000 });
      const metadata = await source.metadata();
      if (!["jpeg", "webp", "png"].includes(metadata.format ?? "") || !metadata.width || !metadata.height || metadata.width > 2560 || metadata.height > 2560 || (metadata.pages ?? 1) > 1) throw Error("Invalid image");
      await source.resize(1, 1).toBuffer();
    }
  } catch { throw new BadRequestException("Nie można odczytać zdjęcia. Dodaj plik JPG, PNG lub WebP o wymiarach do 2560 px."); }
}

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
    await validatePresentation(input.configuration.presentation);
    return this.offers.manager.transaction(async manager => {
      const account = await manager.findOneOrFail(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
      if (objectInput(value).configuration === undefined) {
        const employees = await manager.find(ProviderEmployeeEntity, { where: { accountId } });
        const limit = staffingLimit(account, employees.length);
        input.configuration.areaTiers = input.configuration.areaTiers.map(row => ({ ...row, workers: Math.min(row.workers, limit) }));
      }
      if (input.status !== "archived") await assertOfferStaffing(manager, account, input.configuration, input.status === "published");
      return offerView(await manager.save(ProviderOfferEntity, manager.create(ProviderOfferEntity, { ...input, accountId, revision: 1 })));
    });
  }
  async update(authorization: string | undefined, id: string, value: unknown) {
    const accountId = await this.accountId(authorization);
    const { revision, ...input } = offerInput(value, true);
    const existing = await this.offers.findOneBy({ id, accountId });
    if (!existing) throw new NotFoundException("Nie znaleziono usługi.");
    const presentation = input.configuration.presentation;
    if (presentation && JSON.stringify(presentation) !== JSON.stringify(existing.configuration?.presentation)) {
      await validatePresentation(presentation);
    }
      return this.offers.manager.transaction(async manager => {
        const account = await manager.findOne(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
        if (!account) throw new NotFoundException("Nie znaleziono działalności.");
        const current = await manager.findOne(ProviderOfferEntity, { where: { id, accountId }, lock: { mode: "pessimistic_write" } });
        if (!current) throw new NotFoundException("Nie znaleziono usługi.");
        if (current.revision !== revision) throw new ConflictException("Dane usługi zmieniły się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
        if (objectInput(value).configuration === undefined) input.configuration = storedConfiguration(current);
        if (input.status !== "archived") await assertOfferStaffing(manager, account, input.configuration, input.status === "published");
        const next = manager.create(ProviderOfferEntity, { ...current, ...input, revision: revision! + 1 });
        await publishOffer(manager, next, account);
        return offerView(await manager.save(ProviderOfferEntity, next));
      });
  }
}

