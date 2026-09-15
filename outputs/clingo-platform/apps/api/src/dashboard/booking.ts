import { BadRequestException } from "@nestjs/common";

export type BookingSelection = {
  providerId?: string;
  pricingId?: string;
  frequencyId?: string;
  addOns?: Array<{ id?: string; quantity?: number }>;
};

export type BookingInput = BookingSelection & {
  startsAt?: string;
  sessions?: Array<{ startsAt?: string; endsAt?: string; workers?: number }>;
  address?: string;
  apartment?: string;
  notes?: string;
  contactName?: string;
  contactPhone?: string;
  invoice?: { companyName?: string; taxId?: string; address?: string } | null;
  requestId?: string;
  expectedTotal?: number;
};

export type CustomerAvailability = {
  days?: number[];
  start?: string;
  end?: string;
};

export type MultiScheduleInput = BookingSelection & {
  startsAt?: string;
  availability?: CustomerAvailability;
};

type Offer = {
  pricing?: Array<{ id: string; label: string; priceValue: number; duration: string }> | null;
  frequencies?: Array<{ id: string; label: string; discount: string }> | null;
  addOns?: Array<{ id: string; label: string; priceValue: number; durationMinutes: number }> | null;
};

export const TIME_ZONE = "Europe/Warsaw";
export const money = (value: number) => `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value)} zł`;

export function durationLabel(minutes: number) {
  return [Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} godz.` : "", minutes % 60 ? `${minutes % 60} min` : ""].filter(Boolean).join(" ");
}

export function quoteBooking(offer: Offer, selection: BookingSelection) {
  const pricing = selection.pricingId ? offer.pricing?.find(p => p.id === selection.pricingId) : offer.pricing?.[0];
  const frequency = selection.frequencyId ? offer.frequencies?.find(f => f.id === selection.frequencyId) : offer.frequencies?.[0];
  if (!pricing || !frequency) throw new BadRequestException("Wybrany wariant usługi jest niedostępny. Wróć do ogłoszenia.");
  if (!Array.isArray(selection.addOns ?? []) || (selection.addOns?.length ?? 0) > 50) throw new BadRequestException("Nieprawidłowa lista usług dodatkowych.");
  const ids = new Set<string>();
  const addOns = (selection.addOns ?? []).map(item => {
    const addOn = offer.addOns?.find(a => a.id === item?.id);
    if (!addOn || ids.has(addOn.id) || !Number.isInteger(item.quantity) || item.quantity! < 1 || item.quantity! > 20) {
      throw new BadRequestException("Sprawdź usługi dodatkowe i ich ilość (od 1 do 20).");
    }
    ids.add(addOn.id);
    return { ...addOn, quantity: item.quantity! };
  });
  const hours = Number(pricing.duration.match(/(\d+)\s*(?:godz|h)/)?.[1] ?? 0);
  const minutes = Number(pricing.duration.match(/(\d+)\s*min/)?.[1] ?? 0);
  const durationMinutes = hours * 60 + minutes + addOns.reduce((s, a) => s + a.durationMinutes * a.quantity, 0);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) throw new BadRequestException("Brak czasu realizacji dla wybranej usługi.");
  const discount = Math.abs(Number(frequency.discount.replace(",", ".").replace(/[^\d.]/g, "")));
  const base = Math.round(pricing.priceValue * (1 - discount / 100) * 100) / 100;
  const totalValue = Math.round((base + addOns.reduce((s, a) => s + a.priceValue * a.quantity, 0)) * 100) / 100;
  if (!Number.isFinite(totalValue) || totalValue < 0) throw new BadRequestException("Nieprawidłowa konfiguracja ceny usługi.");
  return {
    pricingId: pricing.id, frequencyId: frequency.id, frequencyLabel: frequency.label,
    addOns: addOns.map(a => ({ id: a.id, label: a.label, quantity: a.quantity })),
    durationMinutes, totalValue,
    summary: { duration: durationLabel(durationMinutes), total: money(totalValue), lines: [
      { id: pricing.id, label: pricing.label, value: money(base) },
      ...addOns.map(a => ({ id: a.id, label: `${a.label} × ${a.quantity}`, value: money(a.priceValue * a.quantity) }))
    ] }
  };
}

export function localDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map(type => parts.find(p => p.type === type)!.value).join("-");
}

export function localTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

// Interpret booking dates in Poland, regardless of the browser/server time zone.
export function warsawDate(date: string, time: string) {
  const target = Date.parse(`${date}T${time}:00Z`);
  let result = new Date(target);
  for (let i = 0; i < 3; i++) {
    const represented = Date.parse(`${localDate(result)}T${localTime(result)}:00Z`);
    result = new Date(result.getTime() + target - represented);
  }
  return result;
}

export function bookingLimit(now: Date) {
  const [year, month, day] = localDate(now).split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year, month + 6, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1 + 6, Math.min(day, monthEnd))).toISOString().slice(0, 10);
}

export function addLocalDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function multiSessionDurations(totalMinutes: number, maximumMinutes = 8 * 60) {
  if (!Number.isInteger(totalMinutes) || totalMinutes < 30 || totalMinutes > 7 * 24 * 60 || !Number.isInteger(maximumMinutes) || maximumMinutes < 15) {
    throw new BadRequestException("Nieprawidłowy czas realizacji zamówienia.");
  }
  const sessionCount = Math.max(2, Math.ceil(totalMinutes / maximumMinutes));
  const base = Math.floor(totalMinutes / sessionCount / 15) * 15;
  const durations = Array.from({ length: sessionCount }, () => base);
  let remainder = totalMinutes - base * sessionCount;
  for (let index = 0; remainder > 0; index = (index + 1) % sessionCount) {
    const step = Math.min(15, remainder);
    durations[index] += step;
    remainder -= step;
  }
  return durations;
}

export type WorkingHours = { days: number[]; startHour: number; endHour: number; bufferMinutes: number; leadHours: number };
export const defaultWorkingHours: WorkingHours = { days: [1, 2, 3, 4, 5, 6], startHour: 8, endHour: 20, bufferMinutes: 0, leadHours: 0 };
export type BusyInterval = { startsAt: Date; endsAt: Date };

export function daySlots(date: string, duration: number, busy: BusyInterval[], hours = defaultWorkingHours, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new BadRequestException("Nieprawidłowa data.");
  }
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (date < localDate(now) || date > bookingLimit(now) || !hours.days.includes(weekday)) return [];
  const slots = [];
  for (let min = hours.startHour * 60; min + duration <= hours.endHour * 60; min += 15) {
    const time = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
    const start = warsawDate(date, time);
    const end = new Date(start.getTime() + duration * 60_000);
    if (start.getTime() <= now.getTime() + hours.leadHours * 3_600_000) continue;
    const buffer = hours.bufferMinutes * 60_000;
    if (busy.some(b => start.getTime() < b.endsAt.getTime() + buffer && end.getTime() + buffer > b.startsAt.getTime())) continue;
    slots.push({ time, startsAt: start.toISOString(), endsAt: end.toISOString() });
  }
  return slots;
}
