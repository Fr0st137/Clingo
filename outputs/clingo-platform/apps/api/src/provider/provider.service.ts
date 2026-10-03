import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService, objectInput } from "../auth/auth.service";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";
import { employeeInput, revisionInput, textInput } from "./provider.input";

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
    return this.employees.save(this.employees.create({ ...employeeInput(value), accountId }));
  }
  async update(authorization: string | undefined, id: string, value: unknown) {
    const employee = await this.get(authorization, id);
    const revision = revisionInput(objectInput(value).revision);
    const input = employeeInput(value);
    const result = await this.employees.update({ id, accountId: employee.accountId, revision }, { ...input, revision: revision + 1 });
    if (result.affected !== 1) throw new ConflictException("Dane zmieniły się w innym oknie. Wczytaj aktualną wersję przed zapisem.");
    return { ...employee, ...input, revision: revision + 1 };
  }
  async remove(authorization: string | undefined, id: string, value: unknown) {
    const employee = await this.get(authorization, id);
    const revision = revisionInput(objectInput(value).revision);
    const result = await this.employees.delete({ id, accountId: employee.accountId, revision });
    if (result.affected !== 1) throw new ConflictException("Dane zmieniły się w innym oknie. Wczytaj aktualną wersję przed usunięciem.");
    return { deleted: true };
  }
}
