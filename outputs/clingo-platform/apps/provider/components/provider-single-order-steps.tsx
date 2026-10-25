"use client";

import { useState } from "react";
import { offerPrice, type OfferAddOn } from "../lib/provider-offers";
import type { AdditionalPosition, QuoteLine } from "../lib/provider-single-order";

const asset = (name: string) => `/figma-assets/orders/single/${name}`;
const summaryPrice = (minor: number) => `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(minor / 100)} zł`;
export type InvoiceDraft = { company: string; taxId: string; address: string };
export type DiscountDraft = { mode: "percent" | "amount"; value: string };

export function SingleOrderExtras({ extras, quantities, onQuantity, positions, onPositions }: {
  extras: OfferAddOn[]; quantities: Record<string, number>; onQuantity: (id: string, count: number) => void;
  positions: AdditionalPosition[]; onPositions: (rows: AdditionalPosition[]) => void;
}) {
  const [picker, setPicker] = useState(false);
  const selected = extras.filter(row => quantities[row.id] > 0);
  const update = (id: string, key: "title" | "quantity" | "price", value: string) => onPositions(positions.map(row => row.id === id ? { ...row, [key]: value } : row));
  return <div className="single-continuation" role="tabpanel" id="single-extras" aria-labelledby="single-extras-tab">
    <div className="single-extras-services"><button type="button" className="single-step-add" aria-expanded={picker} onClick={() => setPicker(value => !value)}>Dodaj<img src={asset("add.svg")} alt="" /></button>
      {picker && <div className="single-extras-picker">{extras.length ? extras.map(row => <label key={row.id}><span>{row.title}<small>{offerPrice(row.priceMinor)} / {row.billingUnit === "halfHour" ? "30 min" : "szt."}</small></span><input type="number" aria-label={`Ilość: ${row.title}`} min={0} max={100} step={1} value={quantities[row.id] ?? 0} onChange={event => { const count = Number(event.target.value); if (Number.isInteger(count) && count >= 0 && count <= 100) onQuantity(row.id, count); }} /></label>) : <p>Wybrana usługa nie ma dodatków. Możesz wpisać własne pozycje poniżej.</p>}</div>}
      {selected.length ? <div className="single-selected-extras">{selected.map(row => <div key={row.id}><span>{row.title} × {quantities[row.id]}</span><strong>{offerPrice(row.priceMinor * quantities[row.id])}</strong><button type="button" aria-label={`Usuń usługę: ${row.title}`} onClick={() => onQuantity(row.id, 0)}><img src={asset("trash.svg")} alt="" /></button></div>)}</div> : <div className="single-extras-empty"><img src={asset("empty-services.png")} width="100" height="85" alt="" /><span>Dodaj usługę</span></div>}
    </div>
    <div className="single-additional-positions"><h3>Wycena dodatkowych pozycji</h3>{positions.map((row, index) => <div className="single-position-row" key={row.id}><input aria-label={`Nazwa pozycji ${index + 1}`} placeholder="Usługi / m² / szt. / inne..." maxLength={180} value={row.title} onChange={event => update(row.id, "title", event.target.value)} /><input aria-label={`Ilość pozycji ${index + 1}`} placeholder="Ilość" type="number" min={1} max={1000} step={1} value={row.quantity} onChange={event => update(row.id, "quantity", event.target.value)} /><input aria-label={`Cena jednostkowa pozycji ${index + 1}`} placeholder="Cena" inputMode="decimal" maxLength={9} value={row.price} onChange={event => update(row.id, "price", event.target.value)} /><button type="button" aria-label={`Usuń pozycję ${index + 1}`} onClick={() => onPositions(positions.filter(item => item.id !== row.id))}><img src={asset("trash.svg")} alt="" /></button></div>)}
      <button type="button" className="single-step-link" disabled={positions.length >= 20} onClick={() => onPositions([...positions, { id: crypto.randomUUID(), title: "", quantity: "", price: "" }])}><span className="single-step-rotated"><img src={asset("add-position.svg")} alt="" /></span>Dodaj pozycję</button>
    </div>
  </div>;
}

export function SingleOrderSummary({ lines, total, discount, discountMinor, discountPercent, onDiscount, invoice, invoiceEnabled, onInvoiceEnabled, onInvoice, busy }: {
  lines: QuoteLine[]; total: number; discount: DiscountDraft; discountMinor: number; discountPercent: number; onDiscount: (value: DiscountDraft) => void;
  invoice: InvoiceDraft; invoiceEnabled: boolean; onInvoiceEnabled: (enabled: boolean) => void; onInvoice: (value: InvoiceDraft) => void; busy: boolean;
}) {
  const percent = discount.mode === "percent" ? Number(discount.value.replace(",", ".")) || 0 : discountPercent;
  return <div className="single-summary">
    <div className="single-summary-prices" aria-live="polite">{lines.map((line, index) => <div key={index}><span>{line.label}</span><span>{summaryPrice(line.amount)}</span></div>)}{discountMinor > 0 && <div><span>Rabat</span><span>−{summaryPrice(discountMinor)}</span></div>}<div className="single-summary-total"><strong>Suma</strong><strong>{summaryPrice(total)}</strong></div></div>
    <div className="single-summary-discount"><div className="single-discount-copy"><span>Dodaj rabat</span><small>Kwota automatycznie się zaktualizuje</small></div><div className="single-discount-percent"><button type="button" aria-label="Zmniejsz rabat" disabled={busy || percent <= 0} onClick={() => onDiscount({ mode: "percent", value: String(Math.max(0, Math.floor(percent) - 1)) })}><img src={asset("minus.svg")} alt="" /></button><span>{new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(percent)} %</span><button type="button" aria-label="Zwiększ rabat" disabled={busy || percent >= 100} onClick={() => onDiscount({ mode: "percent", value: String(Math.min(100, Math.floor(percent) + 1)) })}><span className="single-step-rotated"><img src={asset("discount-plus.svg")} alt="" /></span></button></div><label className="single-discount-amount"><span>zł</span><input aria-label="Kwota rabatu w zł" inputMode="decimal" maxLength={9} value={discount.mode === "amount" ? discount.value : String(discountMinor / 100).replace(".", ",")} disabled={busy} onChange={event => onDiscount({ mode: "amount", value: event.target.value })} /></label></div>
    <button type="button" className="single-step-link" aria-expanded={invoiceEnabled} disabled={busy} onClick={() => onInvoiceEnabled(!invoiceEnabled)}><span className="single-step-rotated"><img src={asset("invoice-plus.svg")} alt="" /></span>{invoiceEnabled ? "Usuń dane do Faktury" : "Dodaj dane do Faktury"}</button>
    {invoiceEnabled && <fieldset className="single-invoice-fields" disabled={busy}><legend>Dane do faktury</legend><label>Nazwa firmy<input value={invoice.company} maxLength={180} onChange={event => onInvoice({ ...invoice, company: event.target.value })} /></label><label>NIP<input value={invoice.taxId} maxLength={20} onChange={event => onInvoice({ ...invoice, taxId: event.target.value })} /></label><label>Adres firmy<input value={invoice.address} maxLength={420} onChange={event => onInvoice({ ...invoice, address: event.target.value })} /></label></fieldset>}
  </div>;
}
