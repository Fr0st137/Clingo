import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderMembershipEntity } from "./provider.entity";

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
  async cancel(authorization: string | undefined, id: string, body: unknown) {
    const membership = await this.membership(authorization);
    if (!["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do zmiany nieobecności.");
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new BadRequestException("Nieprawidłowy formularz.");
    const input = body as Record<string, unknown>;
    if (typeof input.cancelled !== "boolean" || !Number.isSafeInteger(input.revision) || Number(input.revision) < 1 || Object.keys(input).some(key => !["cancelled", "revision"].includes(key))) throw new BadRequestException("Nieprawidłowy formularz.");
    const existing = await this.memberships.query('SELECT revision FROM provider_absences WHERE id=$1 AND account_id=$2', [id, membership.accountId]);
    if (!existing.length) throw new NotFoundException("Nie znaleziono nieobecności.");
    const updated = await this.memberships.query('WITH updated AS (UPDATE provider_absences SET cancelled=$3, revision=revision+1 WHERE id=$1 AND account_id=$2 AND revision=$4 RETURNING revision) SELECT revision FROM updated', [id, membership.accountId, input.cancelled, input.revision]);
    if (!updated.length) throw new ConflictException("Nieobecność zmieniła się w innym oknie. Odśwież listę.");
    return { revision: updated[0].revision };
  }
}
