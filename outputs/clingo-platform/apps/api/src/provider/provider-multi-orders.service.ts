import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderMultiOrderEntity } from "./provider-multi-orders.entity";
import { multiOrderActionInput } from "./provider-multi-orders.input";
import { ProviderAccountEntity, ProviderMembershipEntity } from "./provider.entity";
import { ProviderProjectsService } from "./provider-projects.service";

const multiOrderView = (row: ProviderMultiOrderEntity) => ({ id: row.id, clientId: row.clientId, offerId: row.offerId, clientName: row.clientName, serviceTitle: row.serviceTitle, serviceDetail: row.serviceDetail, startDate: row.startDate, endDate: row.endDate, areaSquareMeters: row.areaSquareMeters, addOnCount: row.addOnCount, totalPriceMinor: row.totalPriceMinor, external: row.external, status: row.status, sessions: row.sessions, notes: row.notes, revision: row.revision, acceptedAt: row.acceptedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() });
@Injectable()
export class ProviderMultiOrdersService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>,
    @InjectRepository(ProviderMultiOrderEntity) private readonly multiOrders: Repository<ProviderMultiOrderEntity>,
    private readonly projects:ProviderProjectsService) {}

  private async accountId(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOneBy({ userId: user.id });
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do zleceń wielosesyjnych.");
    return membership.accountId;
  }

  async list(authorization?: string) {
    const accountId = await this.accountId(authorization);
    return (await this.multiOrders.find({ where: { accountId }, order: { startDate: "ASC", id: "ASC" } })).map(multiOrderView);
  }
  async create(authorization: string | undefined, value: unknown) { return this.projects.createManual(authorization, value); }
  async availability(authorization: string | undefined, value: unknown) { return this.projects.manualAvailability(authorization, value); }

  async action(authorization: string | undefined, id: string, value: unknown) {
    const accountId = await this.accountId(authorization);
    const input = multiOrderActionInput(value);
    if(input.action==="accept")return multiOrderView(await this.projects.acceptManual(authorization,id,input.revision));
    return this.multiOrders.manager.transaction(async manager => {
      const account = await manager.findOne(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
      if (!account) throw new NotFoundException("Nie znaleziono działalności.");
      const order = await manager.findOne(ProviderMultiOrderEntity, { where: { id, accountId }, lock: { mode: "pessimistic_write" } });
      if (!order) throw new NotFoundException("Nie znaleziono zlecenia wielosesyjnego.");
      if (order.revision !== input.revision) throw new ConflictException("Zlecenie zmieniło się w innym oknie. Odśwież listę.");
      if (order.status !== "pending") throw new ConflictException("To zlecenie zostało już rozpatrzone.");
      order.status = "rejected"; order.revision += 1;
      return multiOrderView(await manager.save(ProviderMultiOrderEntity, order));
    });
  }
}
