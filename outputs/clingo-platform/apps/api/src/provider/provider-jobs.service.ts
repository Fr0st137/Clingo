import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";
import { ProviderClientEntity } from "./provider-clients.entity";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { ProviderJobEntity } from "./provider-jobs.entity";
import { jobInput } from "./provider-jobs.input";
import { ProviderBookingsService } from "./provider-bookings.service";
import { accountBookings, bookingJobs } from "../dashboard/booking-bridge";
import { freeEmployees, loadStaffing } from "../dashboard/staffing";
import { ProviderProfileEntity } from "../dashboard/provider-profile.entity";
import { warsawDate } from "../dashboard/booking";
import { ProviderMultiOrderEntity } from "./provider-multi-orders.entity";

export function jobView(row: ProviderJobEntity, completion?: import("./project-completion").ProjectCompletion) {
  const employees=row.employees??(row.employeeId?[{id:row.employeeId,name:row.employeeName}]:[]);
  const employeeName=employees.map(employee=>employee.name).join(", ")||row.employeeName;
  return { id: row.id, clientId: row.clientId, offerId: row.offerId, employeeId: row.employeeId, employees, employeeIds:employees.map(row=>row.id), date: row.date, startMinute: row.startMinute, durationMinutes: row.durationMinutes, priceMinor: row.priceMinor, status: row.status, notes: row.notes, clientName: row.clientName, clientPhone: row.clientPhone, clientEmail: row.clientEmail, address: row.address, serviceTitle: row.serviceTitle, employeeName, multiOrderId: row.multiOrderId, sessionIndex: row.sessionIndex, sessionCount: row.sessionCount, revision: row.revision,projectCompletedAt:completion?.at,releasedByCompletion:completion?.releasedSessionIds.includes(row.projectSessionId??row.id)??false };
}
@Injectable()
export class ProviderJobsService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>,
    @InjectRepository(ProviderJobEntity) private readonly jobs: Repository<ProviderJobEntity>,
    private readonly bookings: ProviderBookingsService) {}
  private async accountId(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOneBy({ userId: user.id });
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do zleceń działalności.");
    return membership.accountId;
  }
  async list(authorization?: string) {
    const accountId = await this.accountId(authorization);
    const [jobs, bookings] = await Promise.all([this.jobs.find({ where: { accountId }, order: { date: "ASC", startMinute: "ASC", id: "ASC" } }), this.bookings.forAccount(accountId)]);
    const ids=[...new Set(jobs.flatMap(row=>row.multiOrderId?[row.multiOrderId]:[]))];
    const projects=ids.length?await this.jobs.manager.find(ProviderMultiOrderEntity,{where:{accountId,id:In(ids)}}):[];
    return [...jobs.map(row=>jobView(row,projects.find(project=>project.id===row.multiOrderId)?.projectData?.completion)), ...bookings].sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute || a.id.localeCompare(b.id));
  }
  async get(authorization: string | undefined, id: string) {
    const accountId = await this.accountId(authorization);
    const job = await this.jobs.findOneBy({ id, accountId });
    if (!job) throw new NotFoundException("Nie znaleziono zlecenia.");
    const project=job.multiOrderId?await this.jobs.manager.findOneBy(ProviderMultiOrderEntity,{id:job.multiOrderId,accountId}):null;
    return jobView(job,project?.projectData?.completion);
  }
  async save(authorization: string | undefined, value: unknown, id?: string) {
    const accountId = await this.accountId(authorization);
    return this.jobs.manager.transaction(async manager => {
      // A database row lock serializes every create/edit for this account, including
      // changes of employee/date. The overlap check and write cannot race.
      const account = await manager.findOne(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
      if (!account) throw new NotFoundException("Nie znaleziono działalności.");
      const existing = id ? await manager.findOneBy(ProviderJobEntity, { id, accountId }) : null;
      if (id && !existing) throw new NotFoundException("Nie znaleziono zlecenia.");
      const { revision, ...input } = jobInput(value, !!id, !!existing?.multiOrderId);
      if (existing && existing.revision !== revision) throw new ConflictException("Zlecenie zmieniło się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
      if (existing?.multiOrderId) {
        const fields = ["clientId","offerId","employeeId","date","startMinute","durationMinutes","priceMinor"] as const;
        const startedAt = warsawDate(existing.date, `${String(Math.floor(existing.startMinute / 60)).padStart(2,"0")}:${String(existing.startMinute % 60).padStart(2,"0")}`);
        const completed = existing.status === "scheduled" && input.status === "completed" && +startedAt + existing.durationMinutes * 60000 <= Date.now();
        if (fields.some(key => input[key] !== existing[key]) || input.address !== undefined && input.address !== existing.address || input.status !== existing.status && !completed) throw new BadRequestException("Edytuj tę sesję z poziomu projektu, aby przeliczyć bilans roboczogodzin.");
        existing.notes = input.notes; existing.status = input.status; existing.revision++;
        await manager.increment(ProviderMultiOrderEntity, {id:existing.multiOrderId,accountId}, "revision", 1);
        const project=await manager.findOneBy(ProviderMultiOrderEntity,{id:existing.multiOrderId,accountId});
        return jobView(await manager.save(ProviderJobEntity, existing),project?.projectData?.completion);
      }
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
      if (input.status === "scheduled" && !employee) {
        const reservations = (await accountBookings(manager, accountId)).flatMap(bookingJobs);
        if (reservations.some(booking => booking.status === "scheduled" && booking.date === input.date && input.startMinute < booking.startMinute + booking.durationMinutes && booking.startMinute < input.startMinute + input.durationMinutes)) throw new BadRequestException("Termin jest zajęty przez rezerwację klienta. Wybierz inny termin.");
      }
      if (employee && input.status === "scheduled") {
        const staff = await loadStaffing(manager, { accountId, id: "manual" } as ProviderProfileEntity, { jobId: id });
        if (staff) {
          staff.category = offer.category;
          const start = warsawDate(input.date, `${String(Math.floor(input.startMinute / 60)).padStart(2, "0")}:${String(input.startMinute % 60).padStart(2, "0")}`);
          if (!freeEmployees(staff, start, new Date(+start + input.durationMinutes * 60000), offer.configuration?.bufferEnabled ? offer.configuration.bufferMinutes : 0).some(row => row.id === employee.id)) throw new BadRequestException("Pracownik nie jest dostępny: sprawdź grafik, rodzaj usługi, nieobecności i inne zlecenia.");
        }
        const sameDay = await manager.find(ProviderJobEntity, { where: { accountId, employeeId: employee.id, date: input.date } });
        if (sameDay.some(job => job.id !== id && job.status === "scheduled" && input.startMinute < job.startMinute + job.durationMinutes && job.startMinute < input.startMinute + input.durationMinutes)) throw new BadRequestException("Pracownik ma już zlecenie w tym czasie. Zmień godzinę lub przypisanie.");
      }
      const sameClient = existing?.clientId === client.id;
      const row = manager.create(ProviderJobEntity, { ...(existing ?? {}), ...input, accountId,
        clientName: sameClient ? existing!.clientName : client.name, clientPhone: sameClient ? existing!.clientPhone : client.phone, clientEmail: sameClient ? existing!.clientEmail : client.email,
        address: input.address ?? (sameClient ? existing!.address : [client.street, [client.postalCode, client.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")),
        serviceTitle: existing?.offerId === offer.id ? existing.serviceTitle : offer.title,
        employeeName: employee?.name ?? (existing?.employeeId === null && input.employeeId === null ? existing.employeeName : ""), revision: existing ? existing.revision + 1 : 1 });
      return jobView(await manager.save(ProviderJobEntity, row));
    });
  }
}
