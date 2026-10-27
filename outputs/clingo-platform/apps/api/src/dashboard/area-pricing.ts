// Shared by the catalogue preview and the server-side quote. Prices are in grosze.
export type AreaPricing = {
  rateMinor: number;
  minutesPer100: number;
  minimum: number;
  maximum: number;
  maxSessionMinutes?: number;
  dailyCapacityByWorkers?: Record<string, number>;
  workerTiers?: Array<{ minSquareMeters: number; maxSquareMeters: number | null; workers: number }>;
};

export function areaPricingOption(config: AreaPricing | null | undefined, id: string | undefined) {
  if (!config || !id || !/^area-\d+(?:\.\d{1,2})?$/.test(id)) return undefined;
  const area = Number(id.slice(5));
  if (!Number.isFinite(area) || area < config.minimum || area > config.maximum) return undefined;
  // Tier boundaries are whole square metres; keep fractional area for the price
  // and workload, rounding it up only when choosing the staffing tier.
  const tierArea = Math.ceil(area);
  const tier = config.workerTiers?.find(row => tierArea >= row.minSquareMeters && (row.maxSquareMeters === null || tierArea <= row.maxSquareMeters));
  const estimatedWorkers = config.workerTiers ? tier?.workers : 1;
  if (!Number.isSafeInteger(estimatedWorkers) || !estimatedWorkers || estimatedWorkers < 1) return undefined;
  const value = Math.round(area * config.rateMinor) / 100;
  const minutes = Math.max(15, Math.ceil(area * config.minutesPer100 / 100 / estimatedWorkers / 15) * 15);
  const price = `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value)} zł`;
  return { id: `area-${area}`, label: `Powierzchnia ${area} m²`, description: "Cena za wskazany metraż. Dojazd w obsługiwanej miejscowości w cenie.",
    price, priceValue: value, estimatedWorkers, duration: `${Math.floor(minutes / 60)} godz. ${minutes % 60} min` };
}
