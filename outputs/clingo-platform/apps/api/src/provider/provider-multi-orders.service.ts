import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderClientEntity } from "./provider-clients.entity";
import { ProviderJobEntity } from "./provider-jobs.entity";
import { ProviderMultiOrderEntity, type ProviderMultiOrderSession } from "./provider-multi-orders.entity";
import { multiOrderActionInput } from "./provider-multi-orders.input";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";

const multiOrderView = (row: ProviderMultiOrderEntity) => ({ id: row.id, clientId: row.clientId, offerId: row.offerId, clientName: row.clientName, serviceTitle: row.serviceTitle, serviceDetail: row.serviceDetail, startDate: row.startDate, endDate: row.endDate, areaSquareMeters: row.areaSquareMeters, addOnCount: row.addOnCount, totalPriceMinor: row.totalPriceMinor, external: row.external, status: row.status, sessions: row.sessions, notes: row.notes, revision: row.revision, acceptedAt: row.acceptedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() });
const validDate = (value: string) => /^20\d{2}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;

function validSessions(value: unknown): value is ProviderMultiOrderSession[] {
  return Array.isArray(value) && value.length >= 2 && value.length <= 31 && value.every((session, index, rows) => session && typeof session === "object"
    && validDate((session as ProviderMultiOrderSession).date)
    && Number.isInteger((session as ProviderMultiOrderSession).startMinute) && (session as ProviderMultiOrderSession).startMinute >= 0
    && Number.isInteger((session as ProviderMultiOrderSession).durationMinutes) && (session as ProviderMultiOrderSession).durationMinutes >= 15
    && (session as ProviderMultiOrderSession).startMinute + (session as ProviderMultiOrderSession).durationMinutes <= 1440
    && ((session as ProviderMultiOrderSession).employeeId === null || /^[a-f0-9-]{36}$/i.test((session as ProviderMultiOrderSession).employeeId!))
    && (index === 0 || `${rows[index - 1].date}:${String(rows[index - 1].startMinute).padStart(4, "0")}` < `${(session as ProviderMultiOrderSession).date}:${String((session as ProviderMultiOrderSession).startMinute).padStart(4, "0")}`));
}

@Injectable()
export class ProviderMultiOrdersService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>,
    @InjectRepository(ProviderMultiOrderEntity) private readonly multiOrders: Repository<ProviderMultiOrderEntity>) {}

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

  async action(authorization: string | undefined, id: string, value: unknown) {
    const accountId = await this.accountId(authorization);
    const input = multiOrderActionInput(value);
    return this.multiOrders.manager.transaction(async manager => {
      const account = await manager.findOne(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
      if (!account) throw new NotFoundException("Nie znaleziono działalności.");
      const order = await manager.findOne(ProviderMultiOrderEntity, { where: { id, accountId }, lock: { mode: "pessimistic_write" } });
      if (!order) throw new NotFoundException("Nie znaleziono zlecenia wielosesyjnego.");
      if (order.revision !== input.revision) throw new ConflictException("Zlecenie zmieniło się w innym oknie. Odśwież listę.");
      if (order.status !== "pending") throw new ConflictException("To zlecenie zostało już rozpatrzone.");
      if (input.action === "reject") {
        order.status = "rejected"; order.revision += 1;
        return multiOrderView(await manager.save(ProviderMultiOrderEntity, order));
      }
      if (!validSessions(order.sessions)) throw new BadRequestException("Harmonogram zlecenia wielosesyjnego jest nieprawidłowy.");
      const client = await manager.findOneBy(ProviderClientEntity, { id: order.clientId, accountId });
      const offer = await manager.findOneBy(ProviderOfferEntity, { id: order.offerId, accountId });
      if (!client || !offer || offer.status === "archived") throw new BadRequestException("Klient lub usługa tego zlecenia nie jest już dostępna.");
      if ((await manager.find(ProviderJobEntity, { where: { accountId, multiOrderId: order.id } })).length) throw new ConflictException("Sesje tego zlecenia są już na liście zamówień.");
      const employeeIds = [...new Set(order.sessions.map(session => session.employeeId).filter((employeeId): employeeId is string => !!employeeId))];
      const employees = employeeIds.length ? await manager.find(ProviderEmployeeEntity, { where: employeeIds.map(employeeId => ({ id: employeeId, accountId })) }) : [];
      if (employees.length !== employeeIds.length) throw new BadRequestException("Przypisany pracownik nie jest już dostępny.");
      const assignedSessions = order.sessions.filter((session): session is ProviderMultiOrderSession & { employeeId: string } => !!session.employeeId);
      if (assignedSessions.some((session, index) => assignedSessions.slice(index + 1).some(other => session.employeeId === other.employeeId && session.date === other.date && session.startMinute < other.startMinute + other.durationMinutes && other.startMinute < session.startMinute + session.durationMinutes))) {
        throw new BadRequestException("Pracownik nie może realizować nakładających się sesji tego zlecenia.");
      }
      const existingJobs = employeeIds.length ? await manager.find(ProviderJobEntity, { where: { accountId, employeeId: In(employeeIds) } }) : [];
      if (assignedSessions.some(session => existingJobs.some(job => job.status !== "cancelled" && job.employeeId === session.employeeId && job.date === session.date && session.startMinute < job.startMinute + job.durationMinutes && job.startMinute < session.startMinute + session.durationMinutes))) {
        throw new BadRequestException("Pracownik ma już zlecenie w czasie jednej z sesji. Zmień przypisanie lub termin.");
      }
      const employeeNames = new Map(employees.map(employee => [employee.id, employee.name]));
      const basePrice = Math.floor(order.totalPriceMinor / order.sessions.length);
      const remainder = order.totalPriceMinor % order.sessions.length;
      const rows = order.sessions.map((session, index) => manager.create(ProviderJobEntity, {
        accountId, clientId: client.id, offerId: offer.id, employeeId: session.employeeId, date: session.date, startMinute: session.startMinute,
        durationMinutes: session.durationMinutes, priceMinor: basePrice + (index < remainder ? 1 : 0), status: "scheduled", revision: 1,
        notes: [`Sesja ${index + 1}/${order.sessions.length} zlecenia wielosesyjnego.`, order.notes].filter(Boolean).join(" "),
        clientName: client.name, clientPhone: client.phone, clientEmail: client.email,
        address: [client.street, [client.postalCode, client.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
        serviceTitle: offer.title, employeeName: session.employeeId ? employeeNames.get(session.employeeId) ?? "" : "",
        multiOrderId: order.id, sessionIndex: index + 1, sessionCount: order.sessions.length
      }));
      await manager.save(ProviderJobEntity, rows);
      order.status = "accepted"; order.acceptedAt = new Date(); order.revision += 1;
      return multiOrderView(await manager.save(ProviderMultiOrderEntity, order));
    });
  }
}
