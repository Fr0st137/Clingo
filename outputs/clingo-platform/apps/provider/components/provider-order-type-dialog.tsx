"use client";

import { ProviderModal } from "./provider-modal";

export function ProviderOrderTypeDialog({ onSingle, onClose }: { onSingle: () => void; onClose: () => void }) {
  return <ProviderModal className="order-type-modal" titleId="order-type-title" descriptionId="order-type-description" onClose={onClose}>
    <div className="order-type-heading">
      <h2 id="order-type-title">Dodaj zamówienie</h2>
      <p id="order-type-description">Wybierz typ zamówienia w zależności od ilości sesji.</p>
    </div>
    <button type="button" className="order-type-choice" onClick={onSingle}>Zamówienie jednosesyjne<img src="/figma-assets/orders/add/next.svg" alt="" /></button>
    <button type="button" className="order-type-choice" disabled title="Dodawanie zamówień wielosesyjnych nie jest jeszcze dostępne">Zamówienie wielosesyjne<img src="/figma-assets/orders/add/next.svg" alt="" /></button>
  </ProviderModal>;
}
