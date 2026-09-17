import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.module";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomBytes } from "crypto";
import { EntityManager, Repository } from "typeorm";
import { AuthSessionEntity } from "./auth-session.entity";
import { UserEntity } from "./user.entity";
import { dummyPasswordCheck, hashPassword, passwordInput, verifyPassword } from "./password";
import { RateLimitService } from "./rate-limit.service";

function emailInput(value: unknown) {
  if (typeof value !== "string" || value.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new BadRequestException("Wpisz poprawny adres e-mail.");
  return value.trim().toLowerCase();
}
export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BadRequestException("Nieprawidłowe dane formularza.");
  return value as Record<string, unknown>;
}
const profileLimits = { firstName: 120, lastName: 120, companyName: 180, phone: 40, street: 180, apartment: 40, city: 120, postalCode: 20 };
function profileInput(input: Record<string, unknown>): Partial<UserEntity> {
  const updates: Record<string, string | null> = {};
  for (const [key, maximum] of Object.entries(profileLimits)) {
    if (!(key in input)) continue;
    const value = input[key];
    if (typeof value !== "string" || value.length > maximum || /[\x00-\x1f\x7f]/.test(value)) throw new BadRequestException(`Nieprawidłowa wartość pola ${key}.`);
    updates[key] = value.trim() || null;
  }
  if (updates.phone && !/^\+?[\d ()-]{7,40}$/.test(updates.phone)) throw new BadRequestException("Wpisz poprawny numer telefonu.");
  if (updates.postalCode && !/^\d{2}-\d{3}$/.test(updates.postalCode)) throw new BadRequestException("Kod pocztowy powinien mieć format 00-000.");
  return updates;
}
function toProfile(user: UserEntity) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
  return {
    apartment: user.apartment, city: user.city, companyName: user.companyName, email: user.email,
    firstName: user.firstName, id: user.id, initials: name.split(/\s+/).slice(0, 2).map(part => part[0].toUpperCase()).join("") || "U",
    lastName: user.lastName, name, phone: user.phone, postalCode: user.postalCode, street: user.street,
    notifications: user.notificationPreferences
  };
}
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(AuthSessionEntity) private readonly sessions: Repository<AuthSessionEntity>,
    private readonly limits: RateLimitService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) {}
  async lookupEmail(value: unknown) {
    const email = emailInput(value);
    await this.limits.consume("lookup-email", email, 20);
    return { exists: (await this.users.countBy({ email })) > 0 };
  }
  async register(value: unknown) {
    const input = objectInput(value);
    const email = emailInput(input.email);
    await this.limits.consume("register-email", email, 5);
    const password = passwordInput(input.password, true);
    const profile = profileInput(input);
    if (await this.users.existsBy({ email })) throw new ConflictException("Konto z tym adresem już istnieje.");
    const { hash, salt } = await hashPassword(password);
    try {
      return await this.users.manager.transaction(async manager => {
        const user = await manager.save(UserEntity, manager.create(UserEntity, { ...profile, email, passwordHash: hash, passwordSalt: salt }));
        return { user: toProfile(user), token: await this.createSession(manager, email) };
      });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ConflictException("Konto z tym adresem już istnieje.");
      throw error;
    }
  }
  async login(value: unknown) {
    const input = objectInput(value);
    const email = emailInput(input.email);
    await this.limits.consume("login-email", email, 10);
    const password = passwordInput(input.password);
    return this.users.manager.transaction(async manager => {
      // Serialize login and password rotation, including session creation.
      const user = await manager.findOne(UserEntity, { where: { email }, lock: { mode: "pessimistic_write" } });
      if (!user) {
        await dummyPasswordCheck(password);
        throw new UnauthorizedException("Nieprawidłowy adres e-mail lub hasło.");
      }
      if (!await verifyPassword(password, user.passwordHash, user.passwordSalt)) throw new UnauthorizedException("Nieprawidłowy adres e-mail lub hasło.");
      if (!user.passwordHash.startsWith("scrypt$")) {
        // Old accounts used trimmed passwords; preserve compatibility only during upgrade.
        const upgraded = await hashPassword(password.trim());
        await manager.update(UserEntity, user.id, { passwordHash: upgraded.hash, passwordSalt: upgraded.salt });
      }
      return { user: toProfile(user), token: await this.createSession(manager, email) };
    });
  }
  private async createSession(manager: EntityManager, email: string) {
    const token = randomBytes(32).toString("hex");
    await manager.save(AuthSessionEntity, { tokenHash: createHash("sha256").update(token).digest("hex"), email,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    return token;
  }
  private tokenHash(authorization?: string) {
    const token = authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!token) throw new UnauthorizedException("Zaloguj się ponownie.");
    return createHash("sha256").update(token).digest("hex");
  }
  async sessionEmail(authorization?: string, manager = this.sessions.manager) {
    const session = await manager.findOneBy(AuthSessionEntity, { tokenHash: this.tokenHash(authorization) });
    if (!session || session.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException("Sesja wygasła. Zaloguj się ponownie.");
    return session.email;
  }
  async sessionUser(authorization?: string) {
    const email = await this.sessionEmail(authorization);
    const user = await this.users.findOneBy({ email });
    if (!user) throw new UnauthorizedException("Zaloguj się ponownie.");
    return user;
  }
  async getProfile(authorization?: string) { return { user: toProfile(await this.sessionUser(authorization)) }; }
  async getSettings(authorization?: string) {
    const { user } = await this.getProfile(authorization);
    const field = (id: keyof typeof user, label: string) => ({ id, label, value: String(user[id] ?? "") });
    return {
      sections: [
        { id: "personal", title: "Dane osobowe", description: "Twoje dane kontaktowe. Zmiana e-maila wymaga weryfikacji i nie jest jeszcze dostępna.", actionLabel: "Zapisz zmiany", fields: [field("firstName", "Imię"), field("lastName", "Nazwisko"), field("companyName", "Nazwa firmy"), { ...field("email", "Adres e-mail"), type: "email" }, field("phone", "Numer telefonu")] },
        { id: "address", title: "Adres", description: "Adres wykorzystywany do realizacji usług.", actionLabel: "Zapisz adres", fields: [field("street", "Ulica i numer"), field("apartment", "Numer mieszkania"), field("city", "Miasto"), field("postalCode", "Kod pocztowy")] },
        { id: "password", title: "Zmień hasło", description: "15–128 znaków. Użyj unikalnej frazy. Zmiana hasła wyloguje pozostałe sesje.", actionLabel: "Zmień hasło", fields: [
          { id: "currentPassword", label: "Obecne hasło", value: "", type: "password" },
          { id: "newPassword", label: "Nowe hasło", value: "", type: "password" },
          { id: "confirmPassword", label: "Powtórz nowe hasło", value: "", type: "password" }
        ] }
      ],
      notifications: [
        { id: "email", title: "Powiadomienia e-mail", description: "Informacje o Twoich zamówieniach.", enabled: user.notifications.email },
        { id: "sms", title: "Powiadomienia SMS", description: "Ważne zmiany dotyczące wizyt.", enabled: user.notifications.sms }
      ],
      externalConnections: []
    };
  }
  async updateProfile(authorization: string | undefined, value: unknown) {
    const input = objectInput(value);
    if (Object.keys(input).some(key => !Object.prototype.hasOwnProperty.call(profileLimits, key))) throw new BadRequestException("Możesz zmienić tylko dane osobowe i adres. E-mail wymaga osobnej weryfikacji.");
    const updates = profileInput(input);
    if (!Object.keys(updates).length) throw new BadRequestException("Brak danych do zapisania.");
    const user = await this.sessionUser(authorization);
    await this.users.update(user.id, updates);
    try { if (this.redis.status === "ready") await this.redis.del(`dashboard:orders:${user.email}`); } catch { /* Optional cache. */ }
    return this.getProfile(authorization);
  }
  async updateNotifications(authorization: string | undefined, value: unknown) {
    const input = objectInput(value);
    if (Object.keys(input).length !== 2 || typeof input.email !== "boolean" || typeof input.sms !== "boolean") throw new BadRequestException("Nieprawidłowe preferencje powiadomień.");
    const user = await this.sessionUser(authorization);
    const notifications = { email: input.email, sms: input.sms };
    await this.users.update(user.id, { notificationPreferences: notifications });
    return { notifications };
  }
  async changePassword(authorization: string | undefined, value: unknown) {
    const email = await this.sessionEmail(authorization);
    await this.limits.consume("password-change", email, 5);
    const input = objectInput(value);
    const current = passwordInput(input.currentPassword);
    const password = passwordInput(input.newPassword, true);
    if (password !== input.confirmPassword) throw new BadRequestException("Nowe hasła muszą być takie same.");
    return this.users.manager.transaction(async manager => {
      const user = await manager.findOne(UserEntity, { where: { email }, lock: { mode: "pessimistic_write" } });
      // Recheck after the lock: a concurrent change may have revoked this token.
      await this.sessionEmail(authorization, manager);
      if (!user || !await verifyPassword(current, user.passwordHash, user.passwordSalt)) throw new BadRequestException("Obecne hasło jest nieprawidłowe.");
      if (await verifyPassword(password, user.passwordHash, user.passwordSalt)) throw new BadRequestException("Nowe hasło musi różnić się od obecnego.");
      const { hash, salt } = await hashPassword(password);
      await manager.update(UserEntity, user.id, { passwordHash: hash, passwordSalt: salt });
      await manager.delete(AuthSessionEntity, { email });
      return { message: "Hasło zmienione. Pozostałe sesje zostały wylogowane.", token: await this.createSession(manager, email) };
    });
  }
  async logout(authorization?: string) {
    await this.sessions.delete({ tokenHash: this.tokenHash(authorization) });
    return { message: "Wylogowano." };
  }
}
