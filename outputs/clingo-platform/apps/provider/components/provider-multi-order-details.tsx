import type { ReactNode } from "react";
import Link from "next/link";
import { ProviderBackLink } from "./provider-list-controls";
import { ProviderShell } from "./provider-shell";

const asset = (name: string) => `/figma-assets/orders/multi-session/details/${name}`;

function OrderAction({ children, icon, className = "" }: { children: ReactNode; icon?: string; className?: string }) {
  return <button type="button" disabled className={`multi-order-button ${className}`}>{children}{icon ? <img src={asset(icon)} alt="" /> : null}</button>;
}

function OrderDetailSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`multi-order-detail-section ${className}`}>{children}</section>;
}

function EmployeeAvatars({ employees }: { employees: ReadonlyArray<"paulina" | "beata"> }) {
  return <div className="multi-order-avatars" aria-label={`${employees.length} przypisanych pracowników`}>{employees.map(employee => <img src={asset(`${employee}.png`)} alt={employee === "paulina" ? "Paulina Jagielska" : "Beata Kaszwabendzka"} key={employee} />)}</div>;
}

function WorkTimeSummary() {
  return <OrderDetailSection className="multi-order-work-summary"><div className="multi-order-section-title"><img src={asset("work-time.svg")} alt="" /><span>Przewidziany czas pracy</span><img src={asset("info.svg")} alt="" /></div><div className="multi-order-progress"><span>100%</span></div><div className="multi-order-work-totals">{[{ label: "Zaplanowane", time: "27h 15min" }, { label: "Pozostało", time: "0h" }, { label: "Wymagane", time: "27h 15min" }].map(item => <div key={item.label}><span>{item.label}</span><strong>{item.time}</strong></div>)}</div></OrderDetailSection>;
}

function AssignedEmployees() {
  return <OrderDetailSection className="multi-order-assigned"><div className="multi-order-section-title"><img src={asset("people.svg")} alt="" /><span>Przypisani pracownicy</span></div><div className="multi-order-employee-list">{[{ name: "Paulina Jagielska", avatar: "paulina.png", time: "24h 30min" }, { name: "Beata Kaszwabendzka", avatar: "beata.png", time: "23h 45min" }].map(employee => <div key={employee.name}><img src={asset(employee.avatar)} alt="" /><span>{employee.name}</span><small>{employee.time}</small></div>)}</div><button type="button" disabled className="multi-order-expand"><img src={asset("expand.svg")} alt="" />Pełna lista</button></OrderDetailSection>;
}

function MultiOrderSidePanel() {
  return (
    <aside className="multi-order-side-panel" aria-label="Szczegóły zamówienia wielosesyjnego">
      <div className="multi-order-client"><div><h1>Anita Kowalska</h1><span>785 663 984</span></div><button type="button" disabled aria-label="Chat z klientem"><img src="/figma-assets/shared/header-chat.svg" alt="" /></button></div>
      <div className="multi-order-tabs"><button type="button" disabled className="is-active">Szczegóły</button><button type="button" disabled>Usługi dodatkowe<b>1</b></button></div>
      <OrderDetailSection className="multi-order-service"><div><span>Sprzątanie obiektów</span><small>Mieszkań i domów</small></div><span className="multi-order-area">925 m²<img src={asset("area.svg")} alt="" /></span></OrderDetailSection>
      <OrderDetailSection className="multi-order-address"><div><span>ul. Floriańska 48/16</span><span><img src={asset("map.svg")} alt="" />00-001 Warszawa</span></div><OrderAction icon="maps.png">Google Maps</OrderAction></OrderDetailSection>
      <OrderDetailSection className="multi-order-price"><div><strong>2 730,00 zł</strong><small>1,50 zł/m²</small></div><OrderAction>Rozlicz</OrderAction></OrderDetailSection>
      <div className="multi-order-discount"><span>Dodaj rabat</span><div className="multi-order-discount-percent"><button type="button" disabled aria-label="Zmniejsz rabat"><img src={asset("minus.svg")} alt="" /></button><span>0 %</span><button type="button" disabled aria-label="Zwiększ rabat"><img className="is-plus" src={asset("discount-plus.svg")} alt="" /></button></div><div className="multi-order-discount-value"><span>zł</span><span>0</span></div></div>
      <WorkTimeSummary />
      <AssignedEmployees />
      <div className="multi-order-notes"><div><OrderAction icon="comments.svg">Uwagi klienta</OrderAction><b>3</b></div><div><OrderAction icon="notes.svg">Notatki i zdjęcia</OrderAction><b>2</b></div></div>
    </aside>
  );
}

type SessionCard = { title: string; time: string; duration: string; x: number; y: number; height: number; session?: boolean; employees: ReadonlyArray<"paulina" | "beata"> };
const calendarCards: ReadonlyArray<SessionCard> = [
  { title: "Sesja #1", time: "8:00 - 15:15", duration: "7h 15min", x: 75.45, y: 75.45, height: 514, session: true, employees: ["beata"] },
  { title: "Joanna Pawlikowska", time: "8:00 - 15:15", duration: "7h 15min", x: 229.71, y: 75.45, height: 270, employees: ["paulina"] },
  { title: "Tomasz Mrozek", time: "8:00 - 15:15", duration: "7h 15min", x: 382.22, y: 75.45, height: 384, employees: ["beata", "paulina"] },
  { title: "Sesja #3", time: "8:00 - 18:00", duration: "10h", x: 534.73, y: 75.45, height: 690, session: true, employees: ["beata", "paulina"] },
  { title: "Aneta Kowalska", time: "8:00 - 15:15", duration: "7h 15min", x: 687.23, y: 75.45, height: 198, employees: ["beata", "paulina"] },
  { title: "Sesja #4", time: "11:00 - 17:30", duration: "6h 30min", x: 687.23, y: 286.81, height: 454, session: true, employees: ["beata", "paulina"] },
  { title: "Sesja #2", time: "12:00 - 20:00", duration: "8h", x: 229.71, y: 387.27, height: 550, session: true, employees: ["paulina"] },
  { title: "Natalia Kaszubska", time: "8:00 - 15:15", duration: "7h 15min", x: 382.22, y: 498.18, height: 177, employees: ["beata", "paulina"] },
  { title: "Krystyna Mańkieska", time: "16:00 - 19:00", duration: "2h", x: 75.45, y: 639.09, height: 200, employees: ["beata", "paulina"] },
  { title: "Patryk G", time: "8:00 - 15:15", duration: "7h 15min", x: 382.22, y: 709.54, height: 202, employees: ["beata", "paulina"] }
];

function MultiOrderCalendarCard({ card }: { card: SessionCard }) {
  return <article className={`multi-order-calendar-card${card.session ? " is-session" : ""}`} style={{ left: card.x, top: card.y, height: card.height }} aria-label={`${card.title}, ${card.time}`}><h3>{card.title}</h3><p>{card.time}<br /><span>{card.duration}</span></p>{card.session ? <p>2 pracowników</p> : null}<EmployeeAvatars employees={card.employees} /></article>;
}

function MultiOrderCalendarToolbar() {
  return <div className="multi-order-calendar-toolbar"><div className="multi-order-calendar-date"><button type="button" disabled className="is-previous" aria-label="Poprzedni tydzień"><img src={asset("angle.svg")} alt="" /></button><strong>Październik 7 - 13</strong><button type="button" disabled className="is-next" aria-label="Następny tydzień"><img src={asset("angle.svg")} alt="" /></button></div><div className="multi-order-calendar-options"><span className="multi-session-order-count"><img src={asset("sessions.svg")} alt="" /><span>Sesje</span><span>5</span></span><span className="multi-order-legend is-project"><i />Sesje projektu</span><span className="multi-order-legend"><i />Inne zamówienia</span><OrderAction icon="history.svg" className="multi-order-history">Historia zmian</OrderAction><OrderAction icon="plus.svg" className="is-blue-outline">Dodaj sesje</OrderAction></div></div>;
}

function MultiOrderCalendar() {
  const weekDays = ["PON", "WT", "ŚR", "CZW", "PT", "SOB", "ND"];
  return <section className="multi-order-calendar" aria-label="Tygodniowy kalendarz sesji zamówienia"><MultiOrderCalendarToolbar /><div className="multi-order-calendar-grid"><div className="multi-order-time-axis">{Array.from({ length: 13 }, (_, i) => <span key={i} style={{ top: 70.45 + i * 70.4549 }}>{i + 8}:00</span>)}</div><div className="multi-order-calendar-days">{weekDays.map((day, i) => <div key={day}><div className="multi-order-day-heading"><span>{day}</span><strong>{i + 15}</strong></div><div className={`multi-order-day-column${i === 6 ? " is-free" : ""}`}>{i === 6 ? <span>Dzień wolny</span> : null}</div></div>)}</div>{Array.from({ length: 13 }, (_, i) => <i className="multi-order-hour-line" key={i} style={{ top: 70.45 + i * 70.4549 }} />)}{calendarCards.map(card => <MultiOrderCalendarCard card={card} key={card.title} />)}</div></section>;
}

export function ProviderMultiOrderDetailsPage() {
  return <ProviderShell active="Zlecenia" figmaNode="4268:8326"><div className="multi-order-content"><div className="multi-order-toolbar"><div><ProviderBackLink href="/orders/multi-session" /><span>|&nbsp; Zamówienie nr 20258754178</span></div><div><Link className="multi-order-button" href="/orders/multi-details/edit">Edytuj<img src="/figma-assets/shared/pencil.svg" alt="" /></Link><OrderAction icon="cancel.svg" className="is-red">Odwołaj</OrderAction><OrderAction icon="completed.svg" className="is-blue-outline">Wykonane</OrderAction><OrderAction icon="save.svg" className="is-blue">Zapisz zmiany</OrderAction></div></div><div className="multi-order-columns" role="region" aria-label="Szczegóły i sesje zamówienia" tabIndex={0}><MultiOrderSidePanel /><MultiOrderCalendar /></div></div></ProviderShell>;
}
