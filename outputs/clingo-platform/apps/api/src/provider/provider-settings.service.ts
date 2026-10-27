import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";
import { contactInput, notificationsInput } from "./provider-settings.input";
import { locationInput } from "./provider-location.input";
import { ProviderProfileEntity } from "../dashboard/provider-profile.entity";
import { BoardListingEntity } from "../dashboard/board-listing.entity";
import type { ProviderLocation } from "./provider-location.input";
import { objectInput } from "../auth/auth.service";
import { assertStaffingReduction, staffingConflicts, staffingLimit } from "./provider-staffing";

function profile(account: ProviderAccountEntity) {
  return { name: account.name, legalName: account.legalName, phone: account.phone,
    contactName: account.contactName, contactPhone: account.contactPhone, contactEmail: account.contactEmail, revision: account.profileRevision };
}
@Injectable()
export class ProviderSettingsService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>,
    @InjectRepository(ProviderAccountEntity) private readonly accounts: Repository<ProviderAccountEntity>,
    @InjectRepository(ProviderEmployeeEntity) private readonly employees: Repository<ProviderEmployeeEntity>) {}

  private async account(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOneBy({ userId: user.id });
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do ustawień działalności.");
    const account = await this.accounts.findOneBy({ id: membership.accountId });
    if (!account) throw new NotFoundException("Nie znaleziono działalności.");
    return { account, user };
  }
  private async savePublicAccount(where: { id: string; profileRevision?: number; locationRevision?: number }, input: Partial<ProviderAccountEntity>) {
    return this.accounts.manager.transaction(async manager => {
      await manager.findOne(ProviderAccountEntity, { where: { id: where.id }, lock: { mode: "pessimistic_write" } });
      const result = await manager.update(ProviderAccountEntity, where, input);
      if (result.affected !== 1) return result;
      const profiles = await manager.find(ProviderProfileEntity, { where: { accountId: where.id } });
      for (const profile of profiles.filter(row => row.id.startsWith("service-"))) {
        const patch: Partial<ProviderProfileEntity> = {};
        if (input.name !== undefined) {
          patch.provider = input.name;
          await manager.update(BoardListingEntity, { id: profile.id }, { provider: input.name });
        }
        if (input.location) {
          const location = input.location as ProviderLocation;
          patch.location = location.city;
          patch.metrics = profile.metrics.map(metric => metric.id === "location" ? { ...metric, value: location.city } : metric);
        }
        await manager.update(ProviderProfileEntity, { id: profile.id, accountId: where.id }, patch);
      }
      return result;
    });
  }
  async getProfile(authorization?: string) {
    const { account, user } = await this.account(authorization);
    return { profile: profile(account), loginEmail: user.email };
  }
  async getStaffing(authorization?: string) {
    const { account } = await this.account(authorization);
    const employees = await this.employees.find({ where: { accountId: account.id } });
    return { mode: account.staffingMode ?? "team", declaredStaff: account.declaredStaff ?? null, employeeCount: employees.length,
      limit: staffingLimit(account, employees.length), revision: account.staffingRevision ?? 1,
      invalidOffers: await staffingConflicts(this.accounts.manager, account, employees.length) };
  }
  async saveStaffing(authorization: string | undefined, value: unknown) {
    const { account } = await this.account(authorization), input = objectInput(value);
    if (Object.keys(input).some(key => !["mode", "declaredStaff", "revision"].includes(key)) || !["solo", "team"].includes(input.mode as string) || !Number.isSafeInteger(input.revision) || Number(input.revision) < 1 || input.declaredStaff !== null && (!Number.isSafeInteger(input.declaredStaff) || Number(input.declaredStaff) < 1 || Number(input.declaredStaff) > 50) || input.mode === "solo" && input.declaredStaff !== 1) throw new BadRequestException("Wybierz sposób pracy i obsadę od 1 do 50 osób. Przy pracy samodzielnej obsada wynosi 1.");
    await this.accounts.manager.transaction(async manager => {
      const current = await manager.findOneOrFail(ProviderAccountEntity, { where: { id: account.id }, lock: { mode: "pessimistic_write" } });
      if (current.staffingRevision !== input.revision) throw new ConflictException("Ustawienia obsady zmieniły się. Wczytaj aktualne dane.");
      const employees = await manager.find(ProviderEmployeeEntity, { where: { accountId: account.id } });
      if (input.mode === "solo" && employees.length > 1) throw new BadRequestException("Praca samodzielna wymaga jednej kartoteki osoby. Najpierw uporządkuj listę pracowników.");
      if (input.declaredStaff !== null && Number(input.declaredStaff) < employees.length) throw new BadRequestException("Deklarowana obsada nie może być mniejsza niż liczba dodanych osób. Najpierw uporządkuj listę pracowników.");
      const next = { ...current, staffingMode: input.mode as "solo" | "team", declaredStaff: input.declaredStaff as number | null };
      if (staffingLimit(next, employees.length) < staffingLimit(current, employees.length) || next.staffingMode === "solo") await assertStaffingReduction(manager, next, employees.length);
      await manager.update(ProviderAccountEntity, { id: account.id }, { staffingMode: next.staffingMode, declaredStaff: next.declaredStaff, staffingRevision: current.staffingRevision + 1 });
    });
    return this.getStaffing(authorization);
  }
  async saveProfile(authorization: string | undefined, value: unknown) {
    const { account, user } = await this.account(authorization);
    const { revision, ...input } = contactInput(value);
    const result = await this.savePublicAccount({ id: account.id, profileRevision: revision }, { ...input, profileRevision: revision + 1 });
    if (result.affected !== 1) throw new ConflictException("Dane działalności zmieniły się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
    return { profile: { ...input, revision: revision + 1 }, loginEmail: user.email };
  }
  async getNotifications(authorization?: string) {
    const { account } = await this.account(authorization);
    return { ...account.notifications, revision: account.notificationsRevision };
  }
  async saveNotifications(authorization: string | undefined, value: unknown) {
    const { account } = await this.account(authorization);
    const { notifications, revision } = notificationsInput(value);
    const result = await this.accounts.update({ id: account.id, notificationsRevision: revision }, { notifications, notificationsRevision: revision + 1 });
    if (result.affected !== 1) throw new ConflictException("Preferencje zmieniły się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
    return { ...notifications, revision: revision + 1 };
  }
  async password(authorization: string | undefined, value: unknown) {
    await this.account(authorization);
    return this.auth.changePassword(authorization, value);
  }
  async getLocation(authorization?: string) {
    const { account } = await this.account(authorization);
    return { ...account.location, revision: account.locationRevision };
  }
  async saveLocation(authorization: string | undefined, value: unknown) {
    const { account } = await this.account(authorization);
    const { revision, ...location } = locationInput(value);
    const result = await this.savePublicAccount({ id: account.id, locationRevision: revision }, { location, locationRevision: revision + 1 });
    if (result.affected !== 1) throw new ConflictException("Lokalizacja zmieniła się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
    return { ...location, revision: revision + 1 };
  }
  async export(authorization?: string) {
    const { account, user } = await this.account(authorization);
    const employees = await this.employees.find({ where: { accountId: account.id }, order: { name: "ASC", id: "ASC" } });
    // Explicit fields prevent future entity additions (credentials/internal data) leaking into exports.
    return { formatVersion: 1, exportedAt: new Date().toISOString(), account: { id: account.id, ...profile(account) },
      loginEmail: user.email, notifications: account.notifications,
      employees: employees.map(employee => ({ id: employee.id, name: employee.name, email: employee.email, phone: employee.phone,
        services: employee.services, showInCalendar: employee.showInCalendar, schedule: employee.schedule })) };
  }
}
