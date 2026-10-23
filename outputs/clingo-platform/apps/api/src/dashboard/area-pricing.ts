// Shared by the catalogue preview and the server-side quote. Prices are in grosze.
export type AreaPricing = {
  rateMinor: number;
  minutesPer100: number;
  minimum: number;
  maximum: number;
};

export function areaPricingOption(config: AreaPricing | null | undefined, id: string | undefined) {
  if (!config || !id || !/^area-\d+(?:\.\d{1,2})?$/.test(id)) return undefined;
  const area = Number(id.slice(5));
  if (!Number.isFinite(area) || area < config.minimum || area > config.maximum) return undefined;
  const value = Math.round(area * config.rateMinor) / 100;
  const minutes = Math.max(15, Math.ceil(area * config.minutesPer100 / 100 / 15) * 15);
  const price = `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value)} zł`;
  return { id: `area-${area}`, label: `Powierzchnia ${area} m²`, description: "Cena za wskazany metraż. Dojazd w obsługiwanej miejscowości w cenie.",
    price, priceValue: value, duration: `${Math.floor(minutes / 60)} godz. ${minutes % 60} min` };
}
