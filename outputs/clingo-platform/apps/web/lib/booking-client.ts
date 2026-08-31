import type { AccountProfile } from "./account";
import type { ProviderProfileData } from "../components/provider-profile-view";

export type BookingSelection = { providerId: string; pricingId: string; frequencyId: string; addOns: Array<{ id: string; quantity: number }> };
export type BookingQuote = { durationMinutes: number; totalValue: number; frequencyLabel: string; summary: { duration: string; total: string; lines: Array<{ id: string; label: string; value: string }> } };
export type BookingSlot = { time: string; startsAt: string; endsAt: string };
export type BookingAvailability = { days: Array<{ date: string; slots: BookingSlot[] }>; quote: BookingQuote; today: string; maxDate: string };
export type BookingPageProps = { selection: BookingSelection; query: string; profile: ProviderProfileData; user: AccountProfile; initialAddress: string };
export type BookingDraft = { startsAt: string; address: string; apartment: string; notes: string; contactName: string; contactPhone: string; invoiceRequested: boolean; companyName: string; taxId: string; invoiceAddress: string; requestId: string };

export class BookingError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function postBooking<T>(action: string, input: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/booking/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal });
  const data = await response.json();
  if (!response.ok) throw new BookingError(typeof data.message === "string" ? data.message : "Nie udało się zapisać zmian. Spróbuj ponownie.", response.status);
  return data;
}
export function bookingDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  return ["year", "month", "day"].map(type => parts.find(p => p.type === type)!.value).join("-");
}
export const bookingTime = (value: string) => new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
export const bookingDayLabel = (value: string) => new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "long", year: "numeric" }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
