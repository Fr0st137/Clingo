export type AdditionalPosition = { id: string; title: string; quantity: string; price: string };
export type QuoteLine = { label: string; amount: number };

export function nonNegativeMinor(value: string): number | null {
  const match = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const result = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return result <= 10000000 ? result : null;
}

export function additionalPositionLines(rows: AdditionalPosition[]): QuoteLine[] {
  if (rows.length > 20) throw new Error("Możesz dodać maksymalnie 20 własnych pozycji.");
  return rows.filter(row => row.title.trim() || row.quantity.trim() || row.price.trim()).map(row => {
    const price = nonNegativeMinor(row.price);
    if (!row.title.trim() || row.title.length > 180 || /[\x00-\x1f\x7f]/.test(row.title)) throw new Error("Podaj nazwę każdej dodatkowej pozycji (maksymalnie 180 znaków).");
    if (!/^\d{1,4}$/.test(row.quantity) || Number(row.quantity) < 1 || Number(row.quantity) > 1000 || price === null) throw new Error("Podaj ilość od 1 do 1000 i poprawną cenę każdej dodatkowej pozycji.");
    const amount = price * Number(row.quantity);
    if (amount > 10000000) throw new Error("Wartość dodatkowej pozycji nie może przekroczyć 100 000 zł.");
    return { label: `${row.title.trim()} × ${Number(row.quantity)}`, amount };
  });
}

export function orderQuote(base: number, extras: QuoteLine[], rows: AdditionalPosition[], discount: { mode: "percent" | "amount"; value: string }) {
  const positions = additionalPositionLines(rows);
  const subtotal = base + [...extras, ...positions].reduce((sum, line) => sum + line.amount, 0);
  if (!Number.isSafeInteger(subtotal) || subtotal < 1 || subtotal > 10000000) throw new Error("Suma zamówienia musi wynosić od 0,01 do 100 000 zł.");
  let discountMinor: number;
  if (discount.mode === "percent") {
    const value = Number(discount.value.replace(",", "."));
    if (!/^\d{1,3}(?:[.,]\d{1,2})?$/.test(discount.value) || value < 0 || value > 100) throw new Error("Podaj rabat od 0 do 100%.");
    discountMinor = Math.round(subtotal * value / 100);
  } else {
    const value = nonNegativeMinor(discount.value);
    if (value === null) throw new Error("Podaj poprawną kwotę rabatu.");
    discountMinor = value;
  }
  if (discountMinor >= subtotal) throw new Error("Po rabacie kwota zamówienia musi wynosić co najmniej 0,01 zł.");
  return { positions, subtotal, discountMinor, total: subtotal - discountMinor, discountPercent: Math.round(discountMinor / subtotal * 10000) / 100 };
}
