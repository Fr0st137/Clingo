const legacyIds: Record<string, string> = {
  "mycie-okien": "window-cleaning", lodowka: "fridge-cleaning", naczynia: "dishes",
  piekarnik: "oven-cleaning", okap: "hood-cleaning", mikrofalowka: "microwave",
  "prasowanie-1": "ironing", "prasowanie-2": "ironing", szafa: "wardrobe-inside",
  szafki: "cabinet-inside", kuweta: "litter-box"
};

// Historical homepage links use Polish IDs. Normalize once before quoting or navigation.
export function parsedAddOnQuantities(value = "") {
  const quantities = new Map<string, number>();
  for (const entry of value.split(",")) {
    const [rawId, rawQuantity] = entry.split(":");
    const id = legacyIds[rawId] ?? rawId;
    const quantity = rawQuantity === undefined ? 1 : Number(rawQuantity);
    if (id && Number.isInteger(quantity) && quantity >= 1 && quantity <= 20) {
      quantities.set(id, Math.min(20, (quantities.get(id) ?? 0) + quantity));
    }
  }
  return quantities;
}
