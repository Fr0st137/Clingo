import { BadRequestException, HttpException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { DataSource, EntityManager } from "typeorm";
import { EmailVerificationEntity } from "./email-verification.entity";
import { EmailService } from "./email.service";
import { RateLimitService } from "./rate-limit.service";
import { UserEntity } from "./user.entity";

export const VERIFICATION_TTL_MS = 10 * 60_000;
export const VERIFICATION_RESEND_MS = 60_000;
export const verificationCodeHash = (token: string, code: string) => createHmac("sha256", token).update(code).digest("hex");
const code = () => String(randomInt(10000)).padStart(4, "0");
const expired = () => new UnauthorizedException("Sesja aktywacji wygasła. Zaloguj się ponownie, aby otrzymać nowy kod.");

@Injectable()
export class EmailVerificationService {
  constructor(private readonly db: DataSource, private readonly mail: EmailService, private readonly limits: RateLimitService) {}
  private token(value: unknown) {
    if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw expired();
    return value;
  }
  private hash(token: string) { return createHash("sha256").update(token).digest("hex"); }
  private view(token: string, user: UserEntity, row: EmailVerificationEntity) {
    return { verificationRequired: true as const, verificationToken: token, email: user.email, expiresAt: row.expiresAt.toISOString(), resendAt: row.resendAt.toISOString() };
  }
  async issue(manager: EntityManager, user: UserEntity) {
    const previous = await manager.findOneBy(EmailVerificationEntity, { userId: user.id });
    if (previous && previous.resendAt.getTime() > Date.now()) throw new HttpException("Kod został niedawno wysłany. Spróbuj ponownie za minutę.", 429);
    await this.limits.consume("verification-send", user.id, 5);
    const token = randomBytes(32).toString("hex"), digits = code(), now = Date.now();
    await manager.delete(EmailVerificationEntity, { userId: user.id });
    const row = await manager.save(EmailVerificationEntity, manager.create(EmailVerificationEntity, { tokenHash: this.hash(token), userId: user.id, codeHash: verificationCodeHash(token, digits), attempts: 0, expiresAt: new Date(now + VERIFICATION_TTL_MS), resendAt: new Date(now + VERIFICATION_RESEND_MS), createdAt: new Date(now) }));
    await this.mail.activation(user.email, digits);
    return this.view(token, user, row);
  }
  private async withChallenge<T>(value: unknown, action: (manager: EntityManager, user: UserEntity, row: EmailVerificationEntity, token: string) => Promise<T>) {
    const token = this.token(value), tokenHash = this.hash(token);
    const initial = await this.db.manager.findOneBy(EmailVerificationEntity, { tokenHash });
    if (!initial) throw expired();
    return this.db.transaction(async manager => {
      // Same user -> challenge lock order as registration/login; verification and resend serialize.
      const user = await manager.findOne(UserEntity, { where: { id: initial.userId }, lock: { mode: "pessimistic_write" } });
      const row = await manager.findOne(EmailVerificationEntity, { where: { tokenHash }, lock: { mode: "pessimistic_write" } });
      if (!user || user.emailVerified || !row || row.createdAt.getTime() + 86400000 <= Date.now()) throw expired();
      return action(manager, user, row, token);
    });
  }
  async status(value: unknown) {
    return this.withChallenge(value, async (_manager, user, row) => ({ email: user.email, expiresAt: row.expiresAt.toISOString(), resendAt: row.resendAt.toISOString(), expired: row.expiresAt.getTime() <= Date.now() }));
  }
  async resend(value: unknown) {
    return this.withChallenge(value, async (manager, user, row, token) => {
      if (row.resendAt.getTime() > Date.now()) throw new HttpException("Poczekaj minutę przed ponownym wysłaniem kodu.", 429);
      if (row.attempts >= 5) throw new HttpException("Wykorzystano limit prób. Zaloguj się ponownie, aby otrzymać nowy kod.", 429);
      await this.limits.consume("verification-send", user.id, 5);
      let digits = code();
      while (verificationCodeHash(token, digits) === row.codeHash) digits = code();
      const now = Date.now();
      row.codeHash = verificationCodeHash(token, digits); row.expiresAt = new Date(now + VERIFICATION_TTL_MS); row.resendAt = new Date(now + VERIFICATION_RESEND_MS);
      await manager.save(row); await this.mail.activation(user.email, digits);
      return this.view(token, user, row);
    });
  }
  async verify<T>(value: unknown, digits: unknown, complete: (manager: EntityManager, user: UserEntity) => Promise<T>): Promise<T> {
    if (typeof digits !== "string" || !/^\d{4}$/.test(digits)) throw new BadRequestException("Wpisz czterocyfrowy kod z wiadomości e-mail.");
    const outcome = await this.withChallenge<{ value?: T; error?: string }>(value, async (manager, user, row, token) => {
      await this.limits.consume("verification-attempt", user.id, 5);
      if (row.expiresAt.getTime() <= Date.now()) return { error: "Kod wygasł. Wyślij nowy kod." };
      if (row.attempts >= 5) return { error: "Wykorzystano limit prób. Zaloguj się ponownie." };
      const expected = Buffer.from(row.codeHash, "hex"), actual = Buffer.from(verificationCodeHash(token, digits), "hex");
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        row.attempts++; await manager.save(row);
        return { error: "Nieprawidłowy kod aktywacyjny. Sprawdź wiadomość i spróbuj ponownie." };
      }
      await manager.update(UserEntity, { id: user.id }, { emailVerified: true }); user.emailVerified = true;
      await manager.delete(EmailVerificationEntity, { userId: user.id });
      return { value: await complete(manager, user) };
    });
    if (outcome.error) throw new BadRequestException(outcome.error);
    return outcome.value!;
  }
}
