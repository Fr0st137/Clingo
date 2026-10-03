import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";
import { ProviderClientEntity } from "./provider-clients.entity";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { ProviderJobEntity } from "./provider-jobs.entity";
import { jobInput } from "./provider-jobs.input";

export function jobView(row: ProviderJobEntity) {
  return { id: row.id, clientId: row.clientId, offerId: row.offerId, employeeId: row.employeeId, date: row.date, startMinute: row.startMinute, durationMinutes: row.durationMinutes, priceMinor: row.priceMinor, status: row.status, notes: row.notes, clientName: row.clientName, clientPhone: row.clientPhone, clientEmail: row.clientEmail, address: row.address, serviceTitle: row.serviceTitle, employeeName: row.employeeName, multiOrderId: row.multiOrderId, sessionIndex: row.sessionIndex, sessionCount: row.sessionCount, revision: row.revision };
}
@Injectable()
export class ProviderJobsService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>,
    @InjectRepository(ProviderJobEntity) private readonly jobs: Repository<ProviderJobEntity>) {}
  private async accountId(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOneBy({ userId: user.id });
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do zleceń działalności.");
    return membership.accountId;
  }
  async list(authorization?: string) {
    const accountId = await this.accountId(authorization);
    return (await this.jobs.find({ where: { accountId }, order: { date: "ASC", startMinute: "ASC", id: "ASC" } })).map(jobView);
  }
  async get(authorization: string | undefined, id: string) {
    const accountId = await this.accountId(authorization);
    const job = await this.jobs.findOneBy({ id, accountId });
    if (!job) throw new NotFoundException("Nie znaleziono zlecenia.");
    return jobView(job);
  }
  async save(authorization: string | undefined, value: unknown, id?: string) {
    const accountId = await this.accountId(authorization);
    const { revision, ...input } = jobInput(value, !!id);
    return this.jobs.manager.transaction(async manager => {
      // A database row lock serializes every create/edit for this account, including
      // changes of employee/date. The overlap check and write cannot race.
      const account = await manager.findOne(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
      if (!account) throw new NotFoundException("Nie znaleziono działalności.");
      const existing = id ? await manager.findOneBy(ProviderJobEntity, { id, accountId }) : null;
      if (id && !existing) throw new NotFoundException("Nie znaleziono zlecenia.");
      if (existing && existing.revision !== revision) throw new ConflictException("Zlecenie zmieniło się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
      const client = await manager.findOneBy(ProviderClientEntity, { id: input.clientId, accountId });
      const offer = await manager.findOneBy(ProviderOfferEntity, { id: input.offerId, accountId });
      const employee = input.employeeId ? await manager.findOneBy(ProviderEmployeeEntity, { id: input.employeeId, accountId }) : null;
      if (!client || !offer || (input.employeeId && !employee)) throw new BadRequestException("Wybrany klient, usługa lub pracownik nie jest dostępny w Twojej działalności. Odśwież listę.");
      if (offer.status === "archived" && existing?.offerId !== offer.id) throw new BadRequestException("Przywróć usługę z archiwum przed utworzeniem zlecenia.");
      if (input.status === "completed") {
        const now = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
        const today = now.slice(0,10), minute = Number(now.slice(11,13)) * 60 + Number(now.slice(14,16));
        if (input.date > today || (input.date === today && input.startMinute + input.durationMinutes > minute)) throw new BadRequestException("Możesz zakończyć zlecenie po upływie zaplanowanego terminu.");
      }
      if (employee && input.status !== "cancelled") {
        const sameDay = await manager.find(ProviderJobEntity, { where: { accountId, employeeId: employee.id, date: input.date } });
        if (sameDay.some(job => job.id !== id && job.status !== "cancelled" && input.startMinute < job.startMinute + job.durationMinutes && job.startMinute < input.startMinute + input.durationMinutes)) throw new BadRequestException("Pracownik ma już zlecenie w tym czasie. Zmień godzinę lub przypisanie.");
      }
      const sameClient = existing?.clientId === client.id;
      const row = manager.create(ProviderJobEntity, { ...(existing ?? {}), ...input, accountId,
        clientName: sameClient ? existing!.clientName : client.name, clientPhone: sameClient ? existing!.clientPhone : client.phone, clientEmail: sameClient ? existing!.clientEmail : client.email,
        address: sameClient ? existing!.address : [client.street, [client.postalCode, client.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
        serviceTitle: existing?.offerId === offer.id ? existing.serviceTitle : offer.title,
        employeeName: employee?.name ?? (existing?.employeeId === null && input.employeeId === null ? existing.employeeName : ""), revision: existing ? existing.revision + 1 : 1 });
      return jobView(await manager.save(ProviderJobEntity, row));
    });
  }
}
