import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderMembershipEntity } from "./provider.entity";
import { ProviderClientEntity } from "./provider-clients.entity";
import { clientInput } from "./provider-clients.input";

const clientView = (row: ProviderClientEntity) => ({ id: row.id, name: row.name, email: row.email, phone: row.phone, street: row.street, postalCode: row.postalCode, city: row.city, notes: row.notes, revision: row.revision });
@Injectable()
export class ProviderClientsService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>,
    @InjectRepository(ProviderClientEntity) private readonly clients: Repository<ProviderClientEntity>) {}
  private async accountId(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOneBy({ userId: user.id });
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do kartoteki klientów.");
    return membership.accountId;
  }
  async list(authorization?: string) {
    const accountId = await this.accountId(authorization);
    return (await this.clients.find({ where: { accountId }, order: { name: "ASC", id: "ASC" } })).map(clientView);
  }
  async get(authorization: string | undefined, id: string) {
    const accountId = await this.accountId(authorization);
    const client = await this.clients.findOneBy({ id, accountId });
    if (!client) throw new NotFoundException("Nie znaleziono klienta.");
    return clientView(client);
  }
  async create(authorization: string | undefined, value: unknown) {
    const accountId = await this.accountId(authorization);
    const input = clientInput(value);
    return clientView(await this.clients.save(this.clients.create({ ...input, accountId, revision: 1 })));
  }
  async update(authorization: string | undefined, id: string, value: unknown) {
    const accountId = await this.accountId(authorization);
    const { revision, ...input } = clientInput(value, true);
    const existing = await this.clients.findOneBy({ id, accountId });
    if (!existing) throw new NotFoundException("Nie znaleziono klienta.");
    const nextRevision = revision! + 1;
    const result = await this.clients.update({ id, accountId, revision }, { ...input, revision: nextRevision });
    if (result.affected !== 1) throw new ConflictException("Dane klienta zmieniły się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
    return { id, ...input, revision: nextRevision };
  }
}
