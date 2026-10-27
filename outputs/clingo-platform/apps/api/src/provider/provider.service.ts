import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService, objectInput } from "../auth/auth.service";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";
import { employeeInput, revisionInput, textInput } from "./provider.input";
import { accountBookings, bookingJobs } from "../dashboard/booking-bridge";
import { ProviderJobEntity } from "./provider-jobs.entity";
import { assertStaffingReduction } from "./provider-staffing";

@Injectable()
export class ProviderService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>,
    @InjectRepository(ProviderEmployeeEntity) private readonly employees: Repository<ProviderEmployeeEntity>) {}

  async context(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOne({ where: { userId: user.id }, relations: { account: true } });
    return { user: { name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email, email: user.email },
      account: membership ? { id: membership.account.id, name: membership.account.name, role: membership.role } : null };
  }

  async createAccount(authorization: string | undefined, value: unknown) {
    const user = await this.auth.sessionUser(authorization);
    const name = textInput(objectInput(value).name, "nazwa działalności", 180, true);
    try {
      await this.memberships.manager.transaction(async manager => {
        if (await manager.existsBy(ProviderMembershipEntity, { userId: user.id })) throw new ConflictException("Masz już konto wykonawcy.");
        const account = await manager.save(ProviderAccountEntity, manager.create(ProviderAccountEntity, { name }));
        await manager.save(ProviderMembershipEntity, manager.create(ProviderMembershipEntity, { accountId: account.id, userId: user.id, role: "owner" }));
      });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ConflictException("Masz już konto wykonawcy.");
      throw error;
    }
    return this.context(authorization);
  }

  private async manage(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOneBy({ userId: user.id });
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do zarządzania pracownikami.");
    return membership.accountId;
  }
  async list(authorization?: string) {
    const accountId = await this.manage(authorization);
    return this.employees.find({ where: { accountId }, order: { name: "ASC", id: "ASC" } });
  }
  async get(authorization: string | undefined, id: string) {
    const accountId = await this.manage(authorization);
    const employee = await this.employees.findOneBy({ id, accountId });
    if (!employee) throw new NotFoundException("Nie znaleziono pracownika.");
    return employee;
  }
  async create(authorization: string | undefined, value: unknown) {
    const accountId = await this.manage(authorization);
    const input = employeeInput(value);
    return this.employees.manager.transaction(async manager => {
      const account = await manager.findOneOrFail(ProviderAccountEntity, { where: { id: accountId }, lock: { mode: "pessimistic_write" } });
      const employees = await manager.find(ProviderEmployeeEntity, { where: { accountId } });
      if (account.staffingMode === "solo" && employees.length >= 1) throw new BadRequestException("Przy pracy samodzielnej możesz dodać tylko jedną osobę. Aby powiększyć zespół, zmień sposób pracy w ustawieniach obsady.");
      if (account.declaredStaff && employees.length >= account.declaredStaff) throw new BadRequestException("Osiągnięto zadeklarowaną obsadę. Najpierw zwiększ ją w ustawieniach działalności.");
      return manager.save(ProviderEmployeeEntity, manager.create(ProviderEmployeeEntity, { ...input, accountId }));
    });
  }
  async update(authorization: string | undefined, id: string, value: unknown) {
    const employee = await this.get(authorization, id);
    const revision = revisionInput(objectInput(value).revision);
    const input = employeeInput(value);
    return this.employees.manager.transaction(async manager => {
    await manager.findOneOrFail(ProviderAccountEntity, { where: { id: employee.accountId }, lock: { mode: "pessimistic_write" } });
    const result = await manager.update(ProviderEmployeeEntity, { id, accountId: employee.accountId, revision }, { ...input, revision: revision + 1 });
    if (result.affected !== 1) throw new ConflictException("Dane zmieniły się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
    return { ...employee, ...input, revision: revision + 1 };
    });
  }
  async remove(authorization: string | undefined, id: string, value: unknown) {
    const employee = await this.get(authorization, id);
    const revision = revisionInput(objectInput(value).revision);
    return this.employees.manager.transaction(async manager => {
    const account = await manager.findOneOrFail(ProviderAccountEntity, { where: { id: employee.accountId }, lock: { mode: "pessimistic_write" } });
    const bookings = (await accountBookings(manager, employee.accountId)).flatMap(bookingJobs);
    const jobs = await manager.find(ProviderJobEntity, { where: { accountId: employee.accountId, status: "scheduled" } });
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (bookings.some(row => row.status === "scheduled" && row.employeeIds.includes(id) && Date.parse(row.endsAt) > Date.now()) || jobs.some(row => (row.employeeId===id||row.employees?.some(employee=>employee.id===id))&&row.date >= today)) throw new ConflictException("Pracownik ma aktywne zlecenia. Najpierw zmień ich obsadę lub odwołaj zlecenia.");
    const employees = await manager.find(ProviderEmployeeEntity, { where: { accountId: employee.accountId } });
    await assertStaffingReduction(manager, account, employees.length - 1);
    const result = await manager.delete(ProviderEmployeeEntity, { id, accountId: employee.accountId, revision });
    if (result.affected !== 1) throw new ConflictException("Dane zmieniły się w innym oknie. Wczytaj aktualną wersję przed usunięciem.");
    return { deleted: true };
    });
  }
}
