import type { ProjectEstimate } from "./project-work";

type ManualProjectConfiguration = { ratePerSquareMeterMinor: number; durationPer100SquareMetersMinutes: number;
  areaTiers: Array<{ minSquareMeters: number; maxSquareMeters: number | null; workers: number }>;
  addOns: Array<{ id: string; title: string; priceMinor: number; billingUnit: "piece" | "halfHour" }> };

export type ManualPosition = { id: string; title: string; quantity: string; price: string };
export type ManualDiscount = { mode: "percent" | "amount"; value: string };
export type ManualPricingInput = { areaSquareMeters: number; quantities: Record<string, number>; positions: ManualPosition[]; discount: ManualDiscount; basePriceMinor?: number };
export function manualMoney(value: string) {
  if (!/^\d{1,6}(?:[.,]\d{1,2})?$/.test(value)) throw new Error("Podaj poprawną kwotę z maksymalnie dwoma miejscami po przecinku.");
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function manualProjectPricing(configuration: ManualProjectConfiguration, input: ManualPricingInput) {
  const area = input.areaSquareMeters;
  if (!Number.isFinite(area) || area <= 0 || area > 10000 || Math.abs(Math.round(area * 100) - area * 100) > 1e-7) throw new Error("Podaj powierzchnię od 0,01 do 10 000 m², z maksymalnie dwoma miejscami po przecinku.");
  const tier = configuration.areaTiers?.find(row => Math.ceil(area) >= row.minSquareMeters && (row.maxSquareMeters === null || Math.ceil(area) <= row.maxSquareMeters));
  if (!tier) throw new Error("Powierzchnia nie mieści się w konfiguracji wybranej usługi.");
  if (!input.quantities || typeof input.quantities !== "object" || Array.isArray(input.quantities) || Object.keys(input.quantities).length > 20) throw new Error("Nieprawidłowy wybór dodatków.");
  const extras = Object.entries(input.quantities).map(([id, quantity]) => {
    const row = configuration.addOns.find(item => item.id === id);
    if (!row || !Number.isInteger(quantity) || quantity < 0 || quantity > 100) throw new Error("Wybierz dostępne dodatki i ilości od 0 do 100.");
    return { ...row, quantity, amount: row.priceMinor * quantity };
  }).filter(row => row.quantity > 0);
  if (!Array.isArray(input.positions) || input.positions.length > 20) throw new Error("Możesz dodać maksymalnie 20 własnych pozycji.");
  const positions = input.positions.filter(row => row.title.trim() || row.quantity.trim() || row.price.trim()).map(row => {
    if (!row.title.trim() || row.title.length > 180 || /[\x00-\x1f\x7f]/.test(row.title) || !/^\d{1,4}$/.test(row.quantity) || Number(row.quantity) < 1 || Number(row.quantity) > 1000) throw new Error("Uzupełnij nazwę i ilość od 1 do 1000 każdej dodatkowej pozycji.");
    const priceMinor = manualMoney(row.price.trim());
    if (priceMinor > 10000000 || priceMinor * Number(row.quantity) > 10000000) throw new Error("Wartość dodatkowej pozycji nie może przekroczyć 100 000 zł.");
    return { title: row.title.trim(), quantity: Number(row.quantity), priceMinor, amount: priceMinor * Number(row.quantity) };
  });
  const base = input.basePriceMinor ?? Math.round(area * configuration.ratePerSquareMeterMinor);
  if (!Number.isSafeInteger(base) || base < 1 || base > 10000000) throw new Error("Cena usługi musi wynosić od 0,01 do 100 000 zł.");
  const subtotal = base + [...extras, ...positions].reduce((sum, row) => sum + row.amount, 0);
  const discount = input.discount;
  if (!discount || typeof discount.value !== "string" || !["percent", "amount"].includes(discount.mode)) throw new Error("Wybierz poprawny rabat.");
  let discountMinor: number;
  if (discount.mode === "percent") {
    const percent = Number(discount.value.replace(",", "."));
    if (!/^\d{1,3}(?:[.,]\d{1,2})?$/.test(discount.value) || percent < 0 || percent > 100) throw new Error("Podaj rabat od 0 do 100%.");
    discountMinor = Math.round(subtotal * percent / 100);
  } else discountMinor = manualMoney(discount.value);
  if (subtotal > 10000000 || discountMinor >= subtotal) throw new Error("Suma zamówienia po rabacie musi wynosić od 0,01 do 100 000 zł.");
  const fixedWorkMinutes = extras.reduce((sum, row) => sum + (row.billingUnit === "halfHour" ? 30 : 0) * row.quantity, 0) * tier.workers;
  const estimate: ProjectEstimate = { source: "area", areaSquareMeters: area, workMinutesPerSquareMeter: configuration.durationPer100SquareMetersMinutes / 100,
    fixedWorkMinutes, requiredWorkMinutes: Math.round((area * configuration.durationPer100SquareMetersMinutes / 100 + fixedWorkMinutes) * 10000) / 10000, estimatedWorkers: tier.workers };
  return { base, extras, positions, subtotal, discountMinor, total: subtotal - discountMinor, discountPercent: Math.round(discountMinor / subtotal * 10000) / 100, estimate };
}
