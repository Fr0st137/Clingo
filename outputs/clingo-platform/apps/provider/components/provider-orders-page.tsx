import { orderDays, type OrderDay } from "./provider-orders-data";
import { ProviderOrderCard } from "./provider-order-card";
import { ProviderShell } from "./provider-shell";
import Link from "next/link";

const asset = (name: string) => `/figma-assets/orders/${name}`;
function OrdersMiniCalendar() {
  const days = [29, 30, ...Array.from({ length: 31 }, (_, i) => i + 1), ...Array.from({ length: 9 }, (_, i) => i + 1)];
  return (
    <section className="orders-calendar" aria-label="Kalendarz poglądowy — październik">
      <div className="orders-calendar-heading"><button type="button" disabled aria-label="Poprzedni miesiąc"><img src={asset("previous.svg")} alt="" /></button><h2>Październik</h2><button type="button" disabled aria-label="Następny miesiąc"><img src={asset("next.svg")} alt="" /></button></div>
      <div className="orders-calendar-weekdays">{["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map(day => <span key={day}>{day}</span>)}</div>
      <div className="orders-calendar-grid">{days.map((day, i) => <div key={i} className={`orders-calendar-day${i < 2 || i > 32 ? " is-outside" : ""}${i >= 14 ? " is-selected" : ""}${i === 13 ? " is-today" : ""}`}><span>{day}</span></div>)}</div>
    </section>
  );
}

function OrdersSidePanel() {
  return <aside className="orders-side-panel"><OrdersMiniCalendar /><div className="orders-side-actions"><Link href="/orders/multi-session"><span>Zlecenia wielosesyjne</span><b>3</b><img src={asset("subpage-arrow.svg")} alt="" /></Link><Link href="/orders/history"><span>Historia zamówień</span><img src={asset("subpage-arrow.svg")} alt="" /></Link></div></aside>;
}

function OrdersToolbar() {
  return <div className="orders-toolbar"><div className="orders-list-title"><h1 id="orders-title">Lista zleceń</h1><span>19 zaplanowanych</span></div><div className="orders-toolbar-actions">{["Wszystkie", "Wszystkie rodzaje usług"].map(label => <button key={label} type="button" disabled>{label}<img src={asset("dropdown.svg")} alt="" /></button>)}<button className="orders-add" type="button" disabled>Dodaj zlecenie<img src={asset("plus.svg")} alt="" /></button></div></div>;
}

function OrdersDayGroup({ day }: { day: OrderDay }) {
  return <section className="orders-day-group" aria-label={`${day.label}, ${day.day} października`}><div className="orders-day-date"><span>{day.label}</span><strong>{day.day}</strong></div><div className="orders-day-cards">{day.orders.map((order, i) => <ProviderOrderCard key={i} order={order} />)}{day.free ? <div className="order-day-free">Dzień wolny</div> : null}</div></section>;
}

export function ProviderOrdersPage() {
  return <ProviderShell active="Zlecenia" figmaNode="3931:6069"><div className="orders-content"><OrdersSidePanel /><section className="orders-list-panel" aria-labelledby="orders-title"><OrdersToolbar /><div className="orders-list-scroll" role="region" aria-label="Zlecenia według dni" tabIndex={0}>{orderDays.map(day => <OrdersDayGroup key={day.day} day={day} />)}</div></section></div></ProviderShell>;
}
