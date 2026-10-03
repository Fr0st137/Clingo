import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { revisionInput, textInput } from "./provider.input";

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

export const defaultOfferConfiguration = (): OfferConfiguration => ({
  ratePerSquareMeterMinor: 150,
  travelRatePerKmMinor: 50,
  durationPer100SquareMetersMinutes: 180,
  areaTiers: [
    { minSquareMeters: 15, maxSquareMeters: 50, workers: 1 },
    { minSquareMeters: 51, maxSquareMeters: 150, workers: 2 },
    { minSquareMeters: 151, maxSquareMeters: null, workers: 3 }
  ],
  leadTimeEnabled: false,
  leadHours: 24,
  bufferEnabled: true,
  bufferMinutes: 30,
  vacuumIncluded: true,
  requiresClientPhotos: true,
  recurringEnabled: true,
  recurringDiscountPercent: 15,
  addOns: [
    { id: "cabinets", title: "Sprzątanie wnętrza szafek", priceMinor: 4500, billingUnit: "piece" },
    { id: "windows", title: "Mycie okien", priceMinor: 3000, billingUnit: "piece" },
    { id: "dishes", title: "Mycie naczyń", priceMinor: 3000, billingUnit: "halfHour" },
    { id: "fridge", title: "Mycie lodówki", priceMinor: 3000, billingUnit: "piece" },
    { id: "microwave", title: "Mycie mikrofalówki", priceMinor: 1500, billingUnit: "piece" },
    { id: "oven", title: "Mycie piekarnika", priceMinor: 3000, billingUnit: "piece" },
    { id: "litter", title: "Sprzątanie kuwety", priceMinor: 1000, billingUnit: "piece" },
    { id: "ironing", title: "Prasowanie", priceMinor: 3000, billingUnit: "halfHour" },
    { id: "wardrobe", title: "Sprzątanie i mycie wnętrza szafy", priceMinor: 3000, billingUnit: "piece" },
    { id: "hood", title: "Mycie okapu", priceMinor: 1500, billingUnit: "piece" }
  ],
  standardsAccepted: false
});

export type OfferInput = { title: string; category: string; description: string; priceMinor: number; durationMinutes: number; status: "draft" | "archived"; configuration: OfferConfiguration };

const integer = (value: unknown, label: string, minimum: number, maximum: number) => {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) throw new BadRequestException(`${label} ma nieprawidłową wartość.`);
  return value as number;
};
const boolean = (value: unknown, label: string) => {
  if (typeof value !== "boolean") throw new BadRequestException(`${label} ma nieprawidłową wartość.`);
  return value;
};
const exactKeys = (input: Record<string, unknown>, keys: string[]) => {
  if (Object.keys(input).some(key => !keys.includes(key))) throw new BadRequestException("Nieznane pole konfiguracji usługi.");
};
export function offerConfiguration(value: unknown): OfferConfiguration {
  if (value === undefined) return defaultOfferConfiguration();
  const input = objectInput(value);
  const keys = ["ratePerSquareMeterMinor", "travelRatePerKmMinor", "durationPer100SquareMetersMinutes", "areaTiers", "leadTimeEnabled", "leadHours", "bufferEnabled", "bufferMinutes", "vacuumIncluded", "requiresClientPhotos", "recurringEnabled", "recurringDiscountPercent", "addOns", "standardsAccepted"];
  exactKeys(input, keys);
  if (keys.some(key => !(key in input))) throw new BadRequestException("Konfiguracja usługi jest niekompletna.");
  if (!Array.isArray(input.areaTiers) || input.areaTiers.length < 1 || input.areaTiers.length > 12) throw new BadRequestException("Dodaj od 1 do 12 przedziałów powierzchni.");
  let previousMaximum: number | null = null;
  const areaTiers = input.areaTiers.map((value, index) => {
    const tier = objectInput(value);
    exactKeys(tier, ["minSquareMeters", "maxSquareMeters", "workers"]);
    const minSquareMeters = integer(tier.minSquareMeters, "Dolna granica powierzchni", 1, 10000);
    const maxSquareMeters = tier.maxSquareMeters === null ? null : integer(tier.maxSquareMeters, "Górna granica powierzchni", 1, 10000);
    if (maxSquareMeters !== null && maxSquareMeters < minSquareMeters) throw new BadRequestException("Górna granica powierzchni nie może być mniejsza od dolnej.");
    if (index > 0 && (previousMaximum === null || minSquareMeters !== previousMaximum + 1)) throw new BadRequestException("Przedziały powierzchni muszą być ciągłe.");
    if (index < (input.areaTiers as unknown[]).length - 1 && maxSquareMeters === null) throw new BadRequestException("Tylko ostatni przedział może nie mieć górnej granicy.");
    previousMaximum = maxSquareMeters;
    return { minSquareMeters, maxSquareMeters, workers: integer(tier.workers, "Liczba pracowników", 1, 50) };
  });
  if (!Array.isArray(input.addOns) || input.addOns.length > 20) throw new BadRequestException("Możesz dodać maksymalnie 20 usług dodatkowych.");
  const seen = new Set<string>();
  const addOns = input.addOns.map(value => {
    const addOn = objectInput(value);
    exactKeys(addOn, ["id", "title", "priceMinor", "billingUnit"]);
    const id = textInput(addOn.id, "identyfikator usługi dodatkowej", 60, true);
    if (!/^[a-z0-9-]+$/.test(id) || seen.has(id)) throw new BadRequestException("Usługi dodatkowe muszą mieć unikalne identyfikatory.");
    seen.add(id);
    if (addOn.billingUnit !== "piece" && addOn.billingUnit !== "halfHour") throw new BadRequestException("Wybierz sposób rozliczania usługi dodatkowej.");
    const billingUnit: OfferAddOn["billingUnit"] = addOn.billingUnit;
    return { id, title: textInput(addOn.title, "nazwa usługi dodatkowej", 100, true), priceMinor: integer(addOn.priceMinor, "Cena usługi dodatkowej", 1, 10000000), billingUnit };
  });
  return {
    ratePerSquareMeterMinor: integer(input.ratePerSquareMeterMinor, "Stawka za metr kwadratowy", 1, 100000),
    travelRatePerKmMinor: integer(input.travelRatePerKmMinor, "Stawka za dojazd", 0, 100000),
    durationPer100SquareMetersMinutes: integer(input.durationPer100SquareMetersMinutes, "Czas wykonania", 15, 1440),
    areaTiers,
    leadTimeEnabled: boolean(input.leadTimeEnabled, "Wyprzedzenie zamówienia"),
    leadHours: integer(input.leadHours, "Wyprzedzenie zamówienia", 1, 720),
    bufferEnabled: boolean(input.bufferEnabled, "Bufor między zleceniami"),
    bufferMinutes: integer(input.bufferMinutes, "Bufor między zleceniami", 0, 240),
    vacuumIncluded: boolean(input.vacuumIncluded, "Dostępność odkurzacza"),
    requiresClientPhotos: boolean(input.requiresClientPhotos, "Zdjęcia od klienta"),
    recurringEnabled: boolean(input.recurringEnabled, "Usługi cykliczne"),
    recurringDiscountPercent: integer(input.recurringDiscountPercent, "Rabat cykliczny", 0, 90),
    addOns,
    standardsAccepted: boolean(input.standardsAccepted, "Akceptacja standardów")
  };
}
export function offerInput(value: unknown, updating = false): OfferInput & { revision?: number } {
  const input = objectInput(value);
  if (Object.keys(input).some(key => !["title", "category", "description", "priceMinor", "durationMinutes", "status", "configuration", ...(updating ? ["revision"] : [])].includes(key))) throw new BadRequestException("Nieznane pole formularza.");
  const title = textInput(input.title, "nazwa usługi", 180, true);
  if (typeof input.category !== "string" || !["homes", "offices", "pressure", "painting"].includes(input.category)) throw new BadRequestException("Wybierz kategorię usługi.");
  if (typeof input.description !== "string" || input.description.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(input.description)) throw new BadRequestException("Opis może zawierać maksymalnie 2000 znaków.");
  if (!Number.isSafeInteger(input.priceMinor) || (input.priceMinor as number) < 1 || (input.priceMinor as number) > 10000000) throw new BadRequestException("Cena musi wynosić od 0,01 do 100 000 zł.");
  if (!Number.isInteger(input.durationMinutes) || (input.durationMinutes as number) < 15 || (input.durationMinutes as number) > 1440) throw new BadRequestException("Czas usługi musi wynosić od 15 do 1440 minut.");
  if (input.status !== "draft" && !(updating && input.status === "archived")) throw new BadRequestException("Nieprawidłowy status usługi.");
  return { title, category: input.category, description: input.description.trim(), priceMinor: input.priceMinor as number, durationMinutes: input.durationMinutes as number, status: input.status, configuration: offerConfiguration(input.configuration), ...(updating ? { revision: revisionInput(input.revision) } : {}) };
}
