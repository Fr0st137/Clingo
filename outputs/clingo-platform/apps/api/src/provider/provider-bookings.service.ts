import { bookingPhoto } from "../dashboard/booking-photos";
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuthService, objectInput } from "../auth/auth.service";
import { accountBookings, bookingJobs, bookingStatus, lockBookingProfile } from "../dashboard/booking-bridge";
import { OrderEntity } from "../dashboard/order.entity";
import { ProviderProfileEntity } from "../dashboard/provider-profile.entity";
import { ProviderMembershipEntity } from "./provider.entity";
import { BookingService } from "../dashboard/booking.service";
import { assignStaff, freeEmployees, loadStaffing } from "../dashboard/staffing";
import { bookingSessions } from "../dashboard/booking-bridge";

export function providerActionMessage(value: unknown) {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.length > 100 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) throw new BadRequestException("Wiadomość może zawierać maksymalnie 100 znaków.");
  return value.trim();
}

@Injectable()
export class ProviderBookingsService {
  constructor(private readonly auth: AuthService, private readonly db: DataSource, private readonly booking: BookingService) {}
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
  async photo(authorization: string | undefined, id: string, photoId: string) {
    await this.get(authorization, id);
    return bookingPhoto(this.db.manager, id, photoId);
  }
  private staffingIndex(order: OrderEntity, value: unknown) {
    const index = value === undefined ? 0 : value;
    if (!Number.isInteger(index) || Number(index) < 0 || Number(index) >= bookingSessions(order).length) throw new BadRequestException("Wybierz poprawną sesję.");
    if (bookingStatus(order.status) !== "scheduled") throw new BadRequestException("Obsadę można zmienić w aktywnej rezerwacji.");
    return Number(index);
  }
  async staffing(authorization: string | undefined, id: string, value: unknown) {
    const { order } = await this.ownedOrder(authorization, id);
    const input = objectInput(value), index = this.staffingIndex(order, input.sessionIndex);
    const profile = await this.db.manager.findOneByOrFail(ProviderProfileEntity, { id: order.providerId! });
    const staff = await loadStaffing(this.db.manager, profile, { orderId: id, sessionIndex: index });
    if (staff) staff.category = order.selectedOptions?.serviceCategory ?? staff.category;
    const session = bookingSessions(order)[index];
    const current = order.selectedOptions?.sessions?.[index]?.employees ?? order.selectedOptions?.employees ?? [];
    return { revision: order.revision, assigned: current, requiredWorkers: order.selectedOptions?.estimatedWorkers ?? 1,
      available: staff ? freeEmployees(staff, session.startsAt, session.endsAt, profile.bookingSettings?.bufferMinutes ?? 0) : [] };
  }
  async assign(authorization: string | undefined, id: string, value: unknown) {
    const { accountId } = await this.ownedOrder(authorization, id);
    const input = objectInput(value);
    if (Object.keys(input).some(key => !["revision", "sessionIndex", "employeeIds", "acceptUnderstaffing"].includes(key)) || !Number.isSafeInteger(input.revision) || !Array.isArray(input.employeeIds) || !input.employeeIds.length || input.employeeIds.length > 50 || input.employeeIds.some(id => typeof id !== "string") || new Set(input.employeeIds).size !== input.employeeIds.length || input.acceptUnderstaffing !== undefined && typeof input.acceptUnderstaffing !== "boolean") throw new BadRequestException("Wybierz co najmniej jednego pracownika i aktualną wersję rezerwacji.");
    const employeeIds = input.employeeIds as string[];
    return this.db.transaction(async manager => {
      const current = await manager.findOneByOrFail(OrderEntity, { id });
      const profile = await lockBookingProfile(manager, current.providerId!);
      if (profile.accountId !== accountId) throw new NotFoundException("Nie znaleziono rezerwacji.");
      const order = await manager.findOneOrFail(OrderEntity, { where: { id }, lock: { mode: "pessimistic_write" } });
      if (order.revision !== input.revision) throw new ConflictException("Rezerwacja zmieniła się. Wczytaj aktualne dane.");
      if (order.mode === "Wielosesyjne") throw new BadRequestException("Zmień obsadę w edytorze projektu, aby potwierdzić bilans roboczogodzin.");
      const index = this.staffingIndex(order, input.sessionIndex), session = bookingSessions(order)[index];
      if (+session.endsAt <= Date.now()) throw new BadRequestException("Nie można zmienić obsady zakończonego terminu.");
      if (employeeIds.length < (order.selectedOptions?.estimatedWorkers ?? 1) && input.acceptUnderstaffing !== true) throw new BadRequestException("Potwierdź zmniejszenie obsady względem liczby osób przyjętej do obliczenia czasu.");
      const staff = await loadStaffing(manager, profile, { orderId: id, sessionIndex: index });
      if (!staff) throw new BadRequestException("Najpierw skonfiguruj pracowników działalności.");
      staff.category = order.selectedOptions?.serviceCategory ?? staff.category;
      const employees = assignStaff(staff, session.startsAt, session.endsAt, employeeIds.length, profile.bookingSettings?.bufferMinutes ?? 0, employeeIds);
      order.selectedOptions ??= { addOns: [], frequencyId: "", pricingId: "" };
      if (order.selectedOptions.sessions?.length) order.selectedOptions.sessions[index] = { ...order.selectedOptions.sessions[index], workers: employees.length, employees };
      else order.selectedOptions.employees = employees;
      order.revision++; await manager.save(order);
      return bookingJobs(order);
    });
  }
  async update(authorization: string | undefined, id: string, value: unknown) {
    const accountId = await this.accountId(authorization);
    const input = objectInput(value);
    if (Object.keys(input).some(key => !["revision", "status", "message"].includes(key)) || !Number.isSafeInteger(input.revision) || (input.revision as number) < 1 || !["completed", "cancelled"].includes(input.status as string)) throw new BadRequestException("Wybierz poprawny status rezerwacji.");
    const message = providerActionMessage(input.message);
    if (input.status === "completed" && message) throw new BadRequestException("Oznaczenie wykonania nie zawiera wiadomości.");
    return this.db.transaction(async manager => {
      const current = await manager.findOneBy(OrderEntity, { id });
      const profile = current?.providerId ? await manager.findOneBy(ProviderProfileEntity, { id: current.providerId, accountId }) : null;
      if (!profile || !current?.userEmail) throw new NotFoundException("Nie znaleziono rezerwacji.");
      const locked = await lockBookingProfile(manager, profile.id);
      if (locked.accountId !== accountId) throw new NotFoundException("Nie znaleziono rezerwacji.");
      const order = await manager.findOne(OrderEntity, { where: { id }, lock: { mode: "pessimistic_write" } });
      if (!order || order.providerId !== profile.id) throw new NotFoundException("Nie znaleziono rezerwacji.");
      if (order.revision !== input.revision || bookingStatus(order.status) !== "scheduled") throw new ConflictException("Rezerwacja zmieniła się. Wczytaj aktualne dane.");
      if (input.status === "completed" && order.mode === "Wielosesyjne") throw new BadRequestException("Zakończ cały projekt w edytorze projektu i potwierdź zwolnienie przyszłych sesji.");
      if (input.status === "completed" && (!order.endsAt || order.endsAt.getTime() > Date.now())) throw new BadRequestException("Możesz zakończyć rezerwację po upływie ostatniego zaplanowanego terminu.");
      order.status = input.status === "completed" ? "Wykonane zlecenie" : "Odwołane zlecenie";
      if (message) {
        order.selectedOptions ??= { addOns: [], frequencyId: "", pricingId: "" };
        order.selectedOptions.providerMessages = [...(order.selectedOptions.providerMessages ?? []), { type: "cancelled" as const, message, createdAt: new Date().toISOString() }].slice(-100);
      }
      order.revision += 1;
      await manager.save(order);
      return bookingJobs(order);
    });
  }
  private async ownedOrder(authorization: string | undefined, id: string) {
    const accountId = await this.accountId(authorization);
    const order = await this.db.manager.findOneBy(OrderEntity, { id });
    const profile = order?.providerId ? await this.db.manager.findOneBy(ProviderProfileEntity, { id: order.providerId, accountId }) : null;
    if (!profile || !order?.userEmail) throw new NotFoundException("Nie znaleziono rezerwacji.");
    return { order, accountId };
  }
  async rescheduleAvailability(authorization: string | undefined, id: string, value: unknown) {
    const { order } = await this.ownedOrder(authorization, id);
    const input = objectInput(value);
    if (Object.keys(input).some(key => !["month", "sessionIndex"].includes(key)) || typeof input.month !== "string") throw new BadRequestException("Wybierz miesiąc.");
    return this.booking.rescheduleAvailability(id, order.userEmail!, input.month, input.sessionIndex as number | undefined);
  }
  async reschedule(authorization: string | undefined, id: string, value: unknown) {
    const { order, accountId } = await this.ownedOrder(authorization, id);
    const input = objectInput(value);
    if (Object.keys(input).some(key => !["revision", "startsAt", "endsAt", "sessionIndex", "message"].includes(key)) || !Number.isSafeInteger(input.revision) || (input.revision as number) < 1 || typeof input.startsAt !== "string" || typeof input.endsAt !== "string") throw new BadRequestException("Wybierz poprawny termin.");
    const start = new Date(input.startsAt), end = new Date(input.endsAt);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) throw new BadRequestException("Wybierz poprawny termin.");
    const message = providerActionMessage(input.message);
    await this.booking.reschedule(id, order.userEmail!, start, end, input.sessionIndex as number | undefined, { accountId, revision: input.revision as number, message });
    return this.get(authorization, id);
  }
}
