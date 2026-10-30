"use client";

import "../app/order-extras-picker.css";
import { useState } from "react";
import type { OfferAddOn } from "../lib/provider-offers";
import { ProviderModal } from "./provider-modal";

const order = ["windows", "fridge", "dishes", "oven", "hood", "microwave", "ironing", "wardrobe", "cabinets", "litter"];
const images: Record<string, string> = { windows: "addon-15.png", fridge: "addon-04.png", dishes: "addon-18.png", oven: "addon-07.png", hood: "addon-12.png", microwave: "addon-05.png", ironing: "addon-09.png", wardrobe: "addon-10.png", cabinets: "addon-01.png", litter: "addon-16.png" };
const asset = (file: string) => `/figma-assets/orders/addons/${file === "increase-windows.svg" ? "increase.svg" : file}`;

export function ProviderOrderExtrasPicker({ extras, quantities, onClose, onSave }: {
  extras: OfferAddOn[]; quantities: Record<string, number>; onClose: () => void; onSave: (quantities: Record<string, number>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, number>>(() => Object.fromEntries(extras.map(row => [row.id, quantities[row.id] ?? 0])));
  const sorted = [...extras].sort((a, b) => (order.includes(a.id) ? order.indexOf(a.id) : order.length) - (order.includes(b.id) ? order.indexOf(b.id) : order.length));
  const change = (id: string, count: number) => setDraft(previous => ({ ...previous, [id]: Math.max(0, Math.min(100, count)) }));
  return <ProviderModal className="order-extras-picker" titleId="order-extras-picker-title" onClose={onClose}>
    <h2 id="order-extras-picker-title">Dodaj usługę dodatkową</h2>
    {sorted.length ? <div className="order-extras-grid">{sorted.map(row => {
      const count = draft[row.id] ?? 0;
      return <article className={`order-extra-tile${count > 0 ? " is-selected" : ""}`} key={row.id} aria-label={row.title} onClick={event => { if (count === 0 && !(event.target instanceof Element && event.target.closest("button"))) change(row.id, 1); }}>
        <div className="order-extra-picture">{images[row.id] ? <img src={`/figma-assets/services/config/${images[row.id]}`} width="40" height="40" alt="" /> : <span aria-hidden="true">{row.title.slice(0, 1).toUpperCase()}</span>}</div>
        <h3 title={row.title}>{row.title}</h3>
        {count > 0 ? <div className={`order-extra-quantity${count >= 100 ? " has-large-quantity" : ""}`} role="group" aria-label={`Ilość: ${row.title}`}>
          <button type="button" className="order-extra-decrease" aria-label={`Zmniejsz ilość: ${row.title}`} onClick={() => change(row.id, count - 1)}><span aria-hidden="true" /></button>
          <output aria-live="polite" aria-label={`Wybrana ilość: ${row.title}`}>{count}</output><span>{row.billingUnit === "halfHour" ? "½h" : "szt."}</span>
          <button type="button" aria-label={`Zwiększ ilość: ${row.title}`} disabled={count >= 100} onClick={() => change(row.id, count + 1)}><img src={asset(row.id === "windows" ? "increase-windows.svg" : "increase.svg")} alt="" /></button>
        </div> : <button type="button" className="order-extra-select" aria-label={`Wybierz: ${row.title}`} onClick={() => change(row.id, 1)}>Wybierz</button>}
        {count > 0 && <span className="order-extra-check"><img src={asset("selected.svg")} alt="" /></span>}
      </article>;
    })}</div> : <p className="order-extras-empty-message">Wybierz usługę w szczegółach zamówienia. Jeśli nie ma dostępnych dodatków, możesz wpisać własne pozycje.</p>}
    <div className="order-extras-picker-actions"><button type="button" onClick={onClose}>Anuluj</button><button type="button" className="is-primary" onClick={() => onSave(draft)}>Zapisz</button></div>
  </ProviderModal>;
}
