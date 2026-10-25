import { ConflictException, NotFoundException } from "@nestjs/common";
import { EntityManager, In } from "typeorm";
import { ProviderAccountEntity } from "../provider/provider.entity";
import { ProviderJobEntity } from "../provider/provider-jobs.entity";
import { OrderEntity } from "./order.entity";
import { ProviderProfileEntity } from "./provider-profile.entity";
import { localDate, localTime, warsawDate } from "./booking";

export const bookingStatus = (status: string): "scheduled" | "completed" | "cancelled" =>
  /odwo|anul|cancel/i.test(status) ? "cancelled" : /wykon|zako|completed|done/i.test(status) ? "completed" : "scheduled";

export function bookingSessions(order: OrderEntity) {
  const sessions = order.mode === "Wielosesyjne" && order.selectedOptions?.sessions?.length
    ? order.selectedOptions.sessions : [{ startsAt: order.startsAt, endsAt: order.endsAt }];
  return sessions.flatMap(session => {
    if (!session.startsAt || !session.endsAt) return [];
    const startsAt = new Date(session.startsAt), endsAt = new Date(session.endsAt);
    return Number.isFinite(startsAt.getTime()) && Number.isFinite(endsAt.getTime()) && endsAt > startsAt ? [{ startsAt, endsAt }] : [];
  });
}

// All writes acquire account -> profile -> order locks in this order.
export async function lockBookingProfile(manager: EntityManager, id: string) {
  const current = await manager.findOneBy(ProviderProfileEntity, { id });
  if (!current) throw new NotFoundException("Ogłoszenie nie jest już dostępne.");
  if (current.accountId) await manager.findOne(ProviderAccountEntity, { where: { id: current.accountId }, lock: { mode: "pessimistic_write" } });
  const profile = await manager.findOne(ProviderProfileEntity, { where: { id }, lock: { mode: "pessimistic_write" } });
  if (!profile || profile.accountId !== current.accountId) throw new ConflictException("Dane wykonawcy zmieniły się. Spróbuj ponownie.");
  return profile;
}

export async function accountBookings(manager: EntityManager, accountId: string) {
  const profiles = await manager.find(ProviderProfileEntity, { where: { accountId } });
  return profiles.length ? manager.find(OrderEntity, { where: { providerId: In(profiles.map(profile => profile.id)) } }) : [];
}

export async function bookingBusy(manager: EntityManager, providerId: string, excludingId?: string) {
  const profile = await manager.findOneBy(ProviderProfileEntity, { id: providerId });
  const orders = profile?.accountId ? await accountBookings(manager, profile.accountId) : await manager.find(OrderEntity, { where: { providerId } });
  const busy = orders.filter(order => order.id !== excludingId && bookingStatus(order.status) === "scheduled").flatMap(bookingSessions);
  if (profile?.accountId) {
    const jobs = await manager.find(ProviderJobEntity, { where: { accountId: profile.accountId, status: "scheduled" } });
    busy.push(...jobs.map(job => {
      const time = `${String(Math.floor(job.startMinute / 60)).padStart(2, "0")}:${String(job.startMinute % 60).padStart(2, "0")}`;
      const startsAt = warsawDate(job.date, time);
      return { startsAt, endsAt: new Date(startsAt.getTime() + job.durationMinutes * 60_000) };
    }));
  }
  return busy;
}

export function bookingJobs(order: OrderEntity) {
  const sessions = bookingSessions(order);
  const total = Math.round(Number((order.summary?.total ?? "0").replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "")) * 100);
  const base = Math.floor(total / Math.max(1, sessions.length));
  return sessions.map((session, index) => {
    const [hour, minute] = localTime(session.startsAt).split(":").map(Number);
    return { id: `booking:${order.id}:${index + 1}`, source: "booking" as const, bookingId: order.id,
      clientId: `customer:${order.userEmail ?? order.id}`, offerId: `profile:${order.providerId}`, employeeId: null, employeeName: "", date: localDate(session.startsAt), startMinute: hour * 60 + minute,
      durationMinutes: (session.endsAt.getTime() - session.startsAt.getTime()) / 60_000,
      priceMinor: base + (index < total % sessions.length ? 1 : 0), status: bookingStatus(order.status), revision: order.revision,
      notes: order.selectedOptions?.notes ?? "", clientName: order.selectedOptions?.contactName ?? "Klient", clientPhone: order.selectedOptions?.contactPhone ?? "",
      clientEmail: order.userEmail ?? "", address: order.address, serviceTitle: order.serviceType,
      sessionIndex: index + 1, sessionCount: sessions.length, multiOrderId: null,
      summary: order.summary, addOns: order.selectedOptions?.addOns ?? [], invoice: order.selectedOptions?.invoice ?? null,
      frequencyLabel: order.selectedOptions?.frequencyLabel ?? null,
      providerMessages: order.selectedOptions?.providerMessages ?? [],
      startsAt: session.startsAt.toISOString(), endsAt: session.endsAt.toISOString() };
  });
}
