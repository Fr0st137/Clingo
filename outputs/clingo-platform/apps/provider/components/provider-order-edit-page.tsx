import type { ReactNode } from "react";
import { ProviderBackLink } from "./provider-list-controls";
import type { EditableProviderOrder } from "./provider-orders-data";
import { ProviderShell } from "./provider-shell";

const asset = (name: string) => `/figma-assets/orders/edit/${name}`;

function EditCard({ title, description, children, className = "" }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return <section className={`order-edit-card ${className}`} aria-label={title}><h2>{title}</h2>{description ? <p className="order-edit-description">{description}</p> : null}{children}</section>;
}

function EditField({ label, value, unit, icon, wide = false }: { label: string; value?: string | number; unit?: string; icon?: string; wide?: boolean }) {
  return <label className={`order-edit-field${wide ? " is-wide" : ""}`}><span>{label}</span><span className="order-edit-input"><input aria-label={label} defaultValue={value ?? ""} placeholder="—" />{unit ? <small>{unit}</small> : null}{icon ? <img src={asset(icon)} alt="" /> : null}</span></label>;
}

function EditActions({ returnHref }: { returnHref: string }) {
  return <div className="order-edit-actions"><ProviderBackLink href={returnHref} /><div><button type="button" disabled className="order-edit-preview">Podgląd<img src={asset("preview.svg")} alt="" /></button><button type="button" disabled className="order-edit-save">Zapisz zmiany<img src="/figma-assets/orders/multi-session/details/save.svg" alt="" /></button></div></div>;
}

function OrderIdentity({ order }: { order: EditableProviderOrder }) {
  return <section className="order-edit-header" aria-label="Wybrane zamówienie"><img src={asset("service.png")} alt="" /><div><h1>{order.service ?? "Zamówienie"}{order.detail ? <> · <span>{order.detail}</span></> : null}</h1><p>{order.client}{order.number ? <> · Zamówienie nr {order.number}</> : null}</p><p>{order.dateLabel}{order.status ? <span className="order-edit-status">{order.status}</span> : null}</p></div></section>;
}

function OrderPeople({ order }: { order: EditableProviderOrder }) {
  return <EditCard title="Przypisani pracownicy" description="Pracownicy przypisani do wybranego zamówienia."><div className="order-edit-people">{order.employees?.length ? order.employees.map(employee => <div key={employee.name}><img src={employee.avatar} alt="" /><span>{employee.name}</span></div>) : <p>{order.employees === undefined ? "—" : "Brak przypisanych pracowników"}</p>}</div></EditCard>;
}

export function ProviderOrderEditPage({ order }: { order: EditableProviderOrder }) {
  return <ProviderShell active="Zlecenia" figmaNode="1979:2340"><div className="order-edit-content" key={order.id}><div className="order-edit-scroll" role="region" aria-label="Formularz edycji zamówienia" tabIndex={0}><div className="order-edit-template"><EditActions returnHref={order.returnHref} /><OrderIdentity order={order} /><div className="order-edit-two-cards"><EditCard title="Kwota zamówienia" description="Kwota ustalona dla tego zamówienia."><EditField label="Cena" value={order.price?.replace(/\s*zł$/, "")} unit="zł" icon="wallet.svg" /></EditCard><EditCard title="Powierzchnia obiektu" description="Powierzchnia przypisana do tego zamówienia."><EditField label="Metraż" value={order.area?.replace(/\s*m²$/, "")} unit="m²" /></EditCard></div><EditCard title="Termin realizacji" description="Początek i koniec wybranego zlecenia."><div className="order-edit-two-fields"><EditField label="Początek" value={order.start} icon="clock.svg" wide /><EditField label="Koniec" value={order.end} icon="clock.svg" wide /></div></EditCard><EditCard title="Dane klienta" description="Dane klienta i miejsce realizacji zamówienia."><div className="order-edit-client-fields"><EditField label="Klient" value={order.client} wide /><EditField label="Adres" value={order.address} wide /><EditField label="Data" value={order.dateLabel} wide /></div></EditCard><OrderPeople order={order} /><EditCard title="Usługi dodatkowe" description="Usługi dodatkowe przypisane do tego zamówienia."><EditField label="Liczba usług" value={order.extras} />{order.sessions !== undefined ? <EditField label="Liczba sesji" value={order.sessions} /> : null}</EditCard><EditCard title="Notatki do zamówienia"><textarea aria-label="Notatki do zamówienia" placeholder="Dodaj informacje dotyczące tego zamówienia..." /></EditCard><EditActions returnHref={order.returnHref} /></div></div></div></ProviderShell>;
}
