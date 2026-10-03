import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";
import { contactInput, notificationsInput } from "./provider-settings.input";
import { locationInput } from "./provider-location.input";

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
  async getProfile(authorization?: string) {
    const { account, user } = await this.account(authorization);
    return { profile: profile(account), loginEmail: user.email };
  }
  async saveProfile(authorization: string | undefined, value: unknown) {
    const { account, user } = await this.account(authorization);
    const { revision, ...input } = contactInput(value);
    const result = await this.accounts.update({ id: account.id, profileRevision: revision }, { ...input, profileRevision: revision + 1 });
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
    const result = await this.accounts.update({ id: account.id, locationRevision: revision }, { location, locationRevision: revision + 1 });
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
