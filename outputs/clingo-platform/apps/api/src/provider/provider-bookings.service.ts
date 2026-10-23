import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuthService, objectInput } from "../auth/auth.service";
import { accountBookings, bookingJobs, bookingStatus, lockBookingProfile } from "../dashboard/booking-bridge";
import { OrderEntity } from "../dashboard/order.entity";
import { ProviderProfileEntity } from "../dashboard/provider-profile.entity";
import { ProviderMembershipEntity } from "./provider.entity";

@Injectable()
export class ProviderBookingsService {
  constructor(private readonly auth: AuthService, private readonly db: DataSource) {}
  private async accountId(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.db.manager.findOneBy(ProviderMembershipEntity, { userId: user.id });
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ForbiddenException("Brak uprawnień do rezerwacji działalności.");
    return membership.accountId;
  }
  async forAccount(accountId: string) {
    return (await accountBookings(this.db.manager, accountId)).filter(order => !!order.userEmail).flatMap(bookingJobs);
  }
  async profiles(authorization?: string) {
    const accountId = await this.accountId(authorization);
    return (await this.db.manager.find(ProviderProfileEntity, { where: { accountId } })).map(row => ({ id: row.id, provider: row.provider }));
  }
  async get(authorization: string | undefined, id: string) {
    const accountId = await this.accountId(authorization);
    const rows = (await this.forAccount(accountId)).filter(row => row.bookingId === id);
    if (!rows.length) throw new NotFoundException("Nie znaleziono rezerwacji.");
    return rows;
  }
  async update(authorization: string | undefined, id: string, value: unknown) {
    const accountId = await this.accountId(authorization);
    const input = objectInput(value);
    if (Object.keys(input).some(key => !["revision", "status"].includes(key)) || !Number.isSafeInteger(input.revision) || (input.revision as number) < 1 || !["completed", "cancelled"].includes(input.status as string)) throw new BadRequestException("Wybierz poprawny status rezerwacji.");
    return this.db.transaction(async manager => {
      const current = await manager.findOneBy(OrderEntity, { id });
      const profile = current?.providerId ? await manager.findOneBy(ProviderProfileEntity, { id: current.providerId, accountId }) : null;
      if (!profile || !current?.userEmail) throw new NotFoundException("Nie znaleziono rezerwacji.");
      const locked = await lockBookingProfile(manager, profile.id);
      if (locked.accountId !== accountId) throw new NotFoundException("Nie znaleziono rezerwacji.");
      const order = await manager.findOne(OrderEntity, { where: { id }, lock: { mode: "pessimistic_write" } });
      if (!order || order.providerId !== profile.id) throw new NotFoundException("Nie znaleziono rezerwacji.");
      if (order.revision !== input.revision || bookingStatus(order.status) !== "scheduled") throw new ConflictException("Rezerwacja zmieniła się. Wczytaj aktualne dane.");
      if (input.status === "completed" && (!order.endsAt || order.endsAt.getTime() > Date.now())) throw new BadRequestException("Możesz zakończyć rezerwację po upływie ostatniego zaplanowanego terminu.");
      order.status = input.status === "completed" ? "Wykonane zlecenie" : "Odwołane zlecenie";
      order.revision += 1;
      await manager.save(order);
      return bookingJobs(order);
    });
  }
}
