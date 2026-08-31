type AreaMetric = { id: string; label: string; value: string };

function normalizePlace(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

export function declaredServiceAreas(metrics: AreaMetric[]) {
  // Use the declared coverage, never the provider's office address. Current
  // offers list cities; distance/radius coverage needs a separate geocoding model.
  const coverage = metrics.find(item => item.id === "location" && /obszar/i.test(item.label));
  return (coverage?.value ?? "").split(/[;,|]/).map(value => value.trim()).filter(Boolean);
}

export function serviceAreaStatus(metrics: AreaMetric[], address: string): "missing" | "unknown" | "supported" | "unsupported" {
  if (!address.trim()) return "missing";
  const areas = declaredServiceAreas(metrics).map(normalizePlace);
  if (!areas.length) return "unknown";
  const normalized = normalizePlace(address);
  // Accept "Warszawa, Floriańska 48" and "Testowa 1, 00-001 Warszawa".
  // Exact locality segments avoid matching street names such as Warszawska.
  const localities = normalized.split(/[,;\n]/).map(part => part.trim().replace(/^\d{2}-\d{3}\s+/, ""));
  const postalLocality = normalized.match(/\b\d{2}-\d{3}\s+([^,;]+)$/)?.[1];
  if (postalLocality) localities.push(postalLocality.trim());
  return localities.some(locality => areas.includes(locality)) ? "supported" : "unsupported";
}
