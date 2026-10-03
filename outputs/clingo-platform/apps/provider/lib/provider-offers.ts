export const offerCategories = [
  { id: "homes", label: "Sprzątanie mieszkań i domów", detail: "Mieszkań i domów", image: "cleaning.png" },
  { id: "offices", label: "Sprzątanie biur i lokali", detail: "Biur i lokali użytkowych", image: "cleaning.png" },
  { id: "pressure", label: "Mycie ciśnieniowe", detail: "Kostki, chodników, tarasów", image: "pressure-washing.png" },
  { id: "painting", label: "Malowanie powierzchni", detail: "Ścian i sufitów", image: "painting.png" }
];
export type OfferAreaTier = { minSquareMeters: number; maxSquareMeters: number | null; workers: number };
export type OfferAddOn = { id: string; title: string; priceMinor: number; billingUnit: "piece" | "halfHour" };
export type OfferConfiguration = {
  ratePerSquareMeterMinor: number;
  travelRatePerKmMinor: number;
  durationPer100SquareMetersMinutes: number;
  areaTiers: OfferAreaTier[];
  leadTimeEnabled: boolean;
  leadHours: number;
  bufferEnabled: boolean;
  bufferMinutes: number;
  vacuumIncluded: boolean;
  requiresClientPhotos: boolean;
  recurringEnabled: boolean;
  recurringDiscountPercent: number;
  addOns: OfferAddOn[];
  standardsAccepted: boolean;
};
export type Offer = { id: string; title: string; category: string; description: string; priceMinor: number; durationMinutes: number; configuration: OfferConfiguration; status: "draft" | "archived"; revision: number };
export type OfferDraft = { title: string; category: string; description: string; price: string; duration: string; status: "draft" | "archived" };
export const offerDraft = (offer?: Offer): OfferDraft => offer ? { title: offer.title, category: offer.category, description: offer.description, price: (offer.priceMinor / 100).toFixed(2).replace(".", ","), duration: String(offer.durationMinutes), status: offer.status } : { title: "", category: "homes", description: "", price: "", duration: "60", status: "draft" };
export function priceMinor(value: string): number | null {
  const match = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const result = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return result >= 1 && result <= 10000000 ? result : null;
}
export const offerPrice = (value: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value / 100);
export const minorInput = (value: number) => (value / 100).toFixed(2).replace(".", ",");
