import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderAccountEntity, ProviderEmployeeEntity, ProviderMembershipEntity } from "./provider.entity";
import { objectInput } from "../auth/auth.service";
import { warsawDate, localDate, localTime } from "../dashboard/booking";
import { randomUUID } from "crypto";

@Injectable()
export class ProviderAbsencesService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>) {}
  private async membership(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOneBy({ userId: user.id });
    if (!membership) throw new ForbiddenException("Brak dostępu do nieobecności działalności.");
    return membership;
  }
  async list(authorization?: string) {
    const membership = await this.membership(authorization);
    return this.memberships.query(`SELECT id, number, revision, reason, notes,
      (SELECT jsonb_agg(e->>'name') FROM jsonb_array_elements(employees) e) employees,
      (SELECT jsonb_agg(e->>'id') FROM jsonb_array_elements(employees) e) "employeeIds",
      to_char(starts_at AT TIME ZONE 'Europe/Warsaw', 'YYYY-MM-DD"T"HH24:MI') start,
      to_char(ends_at AT TIME ZONE 'Europe/Warsaw', 'YYYY-MM-DD"T"HH24:MI') "end",
      CASE WHEN ends_at <= now() THEN 'completed' WHEN starts_at <= now() THEN 'ongoing' ELSE 'upcoming' END status
      FROM provider_absences WHERE account_id=$1 AND cancelled=false ORDER BY created_at DESC, number DESC`, [membership.accountId]);
  }
  async create(authorization: string | undefined, value: unknown) {
    const membership = await this.membership(authorization);
    if (!["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do dodawania nieobecności.");
    const input = objectInput(value);
    const reasons = ["Urlop", "Choroba", "Inne", "Urlop na żądanie", "Urlop wypoczynkowy", "Szkolenie", "L4"];
    if (Object.keys(input).some(key => !["start", "end", "reason", "employeeIds", "notes"].includes(key)) || !reasons.includes(input.reason as string) || !Array.isArray(input.employeeIds) || !input.employeeIds.length || input.employeeIds.length > 500 || input.employeeIds.some(id => typeof id !== "string") || new Set(input.employeeIds).size !== input.employeeIds.length || input.notes !== undefined && (typeof input.notes !== "string" || input.notes.length > 2000)) throw new BadRequestException("Wybierz powód i pracowników nieobecności.");
    const parse = (value: unknown) => {
      if (typeof value !== "string" || !/^20\d{2}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new BadRequestException("Podaj poprawną datę i godzinę nieobecności.");
      const day = value.slice(0, 10);
      if (!Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) throw new BadRequestException("Podaj istniejącą datę nieobecności.");
      const date = warsawDate(value.slice(0, 10), value.slice(11));
      if (localDate(date) + "T" + localTime(date) !== value) throw new BadRequestException("Podana godzina nie istnieje w czasie polskim.");
      return date;
    };
    const start = parse(input.start), end = parse(input.end);
    if (+end <= +start) throw new BadRequestException("Koniec nieobecności musi przypadać po jej początku.");
    return this.memberships.manager.transaction(async manager => {
      await manager.findOneOrFail(ProviderAccountEntity, { where: { id: membership.accountId }, lock: { mode: "pessimistic_write" } });
      const employees = await manager.find(ProviderEmployeeEntity, { where: { accountId: membership.accountId } });
      const selected = input.employeeIds as string[];
      if (selected.some(id => !employees.some(row => row.id === id))) throw new BadRequestException("Pracownik nie należy do Twojej działalności. Odśwież listę.");
      const snapshots = selected.map(id => { const employee = employees.find(row => row.id === id)!; return { id, name: employee.name }; });
      const [row] = await manager.query('INSERT INTO provider_absences (id,account_id,employees,starts_at,ends_at,reason,notes) VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7) RETURNING id,number,revision', [randomUUID(), membership.accountId, JSON.stringify(snapshots), start, end, input.reason, input.notes ?? ""]);
      return row;
    });
  }
  async cancel(authorization: string | undefined, id: string, body: unknown) {
    const membership = await this.membership(authorization);
    if (!["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do zmiany nieobecności.");
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new BadRequestException("Nieprawidłowy formularz.");
    const input = body as Record<string, unknown>;
    if (typeof input.cancelled !== "boolean" || !Number.isSafeInteger(input.revision) || Number(input.revision) < 1 || Object.keys(input).some(key => !["cancelled", "revision"].includes(key))) throw new BadRequestException("Nieprawidłowy formularz.");
    return this.memberships.manager.transaction(async manager => {
    await manager.findOneOrFail(ProviderAccountEntity, { where: { id: membership.accountId }, lock: { mode: "pessimistic_write" } });
    const existing = await manager.query('SELECT revision FROM provider_absences WHERE id=$1 AND account_id=$2', [id, membership.accountId]);
    if (!existing.length) throw new NotFoundException("Nie znaleziono nieobecności.");
    const updated = await manager.query('WITH updated AS (UPDATE provider_absences SET cancelled=$3, revision=revision+1 WHERE id=$1 AND account_id=$2 AND revision=$4 RETURNING revision) SELECT revision FROM updated', [id, membership.accountId, input.cancelled, input.revision]);
    if (!updated.length) throw new ConflictException("Nieobecność zmieniła się w innym oknie. Odśwież listę.");
    return { revision: updated[0].revision };
    });
  }
}
