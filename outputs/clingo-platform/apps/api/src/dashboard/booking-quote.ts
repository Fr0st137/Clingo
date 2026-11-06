import { areaPricingOption, type AreaPricing } from "./area-pricing";
import { bookingMode, type WorkingHours } from "./booking-policy";

export type BookingSelection = {
  providerId?: string;
  pricingId?: string;
  frequencyId?: string;
  addOns?: Array<{ id?: string; quantity?: number }>;
  splitIntoSessions?: boolean;
};

export class BookingQuoteError extends Error {}

export type BookingQuoteOffer = {
  tags?: string[];
  bookingSettings?: WorkingHours | null;
  areaPricing?: AreaPricing | null;
  pricing?: Array<{ id: string; label: string; priceValue: number; duration: string }> | null;
  frequencies?: Array<{ id: string; label: string; discount: string }> | null;
  addOns?: Array<{ id: string; label: string; priceValue: number; durationMinutes: number }> | null;
};

export const money = (value: number) => `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value)} zł`;

export function durationLabel(minutes: number) {
  return [Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} godz.` : "", minutes % 60 ? `${minutes % 60} min` : ""].filter(Boolean).join(" ");
}

export function calculateBookingQuote(offer: BookingQuoteOffer, selection: BookingSelection) {
  const areaOption = offer.areaPricing ? areaPricingOption(offer.areaPricing, selection.pricingId) : undefined;
  const pricing = offer.areaPricing ? areaOption : selection.pricingId ? offer.pricing?.find(p => p.id === selection.pricingId) : offer.pricing?.[0];
  let frequency = selection.frequencyId ? offer.frequencies?.find(f => f.id === selection.frequencyId) : offer.frequencies?.[0];
  if (!pricing || !frequency) throw new BookingQuoteError("Wybrany wariant usługi jest niedostępny. Wróć do ogłoszenia.");
  if (!Array.isArray(selection.addOns ?? []) || (selection.addOns?.length ?? 0) > 50) throw new BookingQuoteError("Nieprawidłowa lista usług dodatkowych.");
  const ids = new Set<string>();
  const addOns = (selection.addOns ?? []).map(item => {
    const addOn = offer.addOns?.find(a => a.id === item?.id);
    if (!addOn || ids.has(addOn.id) || !Number.isInteger(item.quantity) || item.quantity! < 1 || item.quantity! > 20) {
      throw new BookingQuoteError("Sprawdź usługi dodatkowe i ich ilość (od 1 do 20).");
    }
    ids.add(addOn.id);
    return { ...addOn, quantity: item.quantity! };
  });
  const hours = Number(pricing.duration.match(/(\d+)\s*(?:godz|h)/)?.[1] ?? 0);
  const minutes = Number(pricing.duration.match(/(\d+)\s*min/)?.[1] ?? 0);
  const durationMinutes = hours * 60 + minutes + addOns.reduce((s, a) => s + a.durationMinutes * a.quantity, 0);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) throw new BookingQuoteError("Brak czasu realizacji dla wybranej usługi.");
  if (selection.splitIntoSessions !== undefined && typeof selection.splitIntoSessions !== "boolean") throw new BookingQuoteError("Nieprawidłowy tryb realizacji.");
  const mode = bookingMode(durationMinutes, offer, selection.splitIntoSessions, areaOption?.estimatedWorkers);
  if (areaOption && mode === "multi") frequency = offer.frequencies?.find(row => row.id === "once") ?? frequency;
  const discount = Math.abs(Number(frequency.discount.replace(",", ".").replace(/[^\d.]/g, "")));
  const base = Math.round(pricing.priceValue * (1 - discount / 100) * 100) / 100;
  const totalValue = Math.round((base + addOns.reduce((s, a) => s + a.priceValue * a.quantity, 0)) * 100) / 100;
  if (!Number.isFinite(totalValue) || totalValue < 0) throw new BookingQuoteError("Nieprawidłowa konfiguracja ceny usługi.");
  return {
    mode, baseValue: base,
    ...(areaOption ? { estimatedWorkers: areaOption.estimatedWorkers } : {}),
    pricingId: pricing.id, frequencyId: frequency.id, frequencyLabel: frequency.label,
    addOns: addOns.map(a => ({ id: a.id, label: a.label, quantity: a.quantity })),
    durationMinutes, totalValue,
    summary: { duration: durationLabel(durationMinutes), total: money(totalValue), lines: [
      { id: pricing.id, label: pricing.label, value: money(base) },
      ...addOns.map(a => ({ id: a.id, label: `${a.label} × ${a.quantity}`, value: money(a.priceValue * a.quantity) }))
    ] }
  };
}

