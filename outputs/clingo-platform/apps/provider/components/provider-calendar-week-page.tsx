import { ProviderCalendarAppointment, type CalendarAppointment } from "./provider-calendar-appointment";
import { ProviderCalendarToolbar } from "./provider-calendar-toolbar";
import { ProviderShell } from "./provider-shell";

type WeekDay = { date: string; summary: string; today?: boolean; appointments: CalendarAppointment[]; absence?: boolean };
const referenceAppointment: CalendarAppointment = { start: "08:45", end: "10:30", client: "Anita Kowalska", service: "Sprzątanie obiektów", detail: "Mieszkań i domów", top: 51, height: 101.5, status: "confirmed" };
const days: WeekDay[] = [
  { date: "Pn. 7", summary: "8 zamówień", appointments: [{ ...referenceAppointment, status: "muted" }, { ...referenceAppointment, start: "12:30", end: "16:00", top: 239.5, height: 203, status: "muted" }] },
  { date: "Wt. 8", summary: "Przykład · 30 min", appointments: [{ ...referenceAppointment, end: "09:15", height: 29, compact: "30", service: undefined, detail: undefined }] },
  { date: "Śr. 9", summary: "1 zamówienie", appointments: [{ ...referenceAppointment, detail: "Biur i lokali użytkowych", status: "muted" }], absence: true },
  { date: "Czw. 10", summary: "Przykład · 45 min", appointments: [{ ...referenceAppointment, end: "09:30", height: 43.5, compact: "45", service: undefined, detail: undefined }] },
  { date: "Pt. 11", summary: "Przykład · 60 min", appointments: [{ ...referenceAppointment, end: "09:45", height: 58, compact: "60", detail: undefined }] },
  { date: "Sb. 12", summary: "2 zamówienia", today: true, appointments: [referenceAppointment, { ...referenceAppointment, start: "12:30", end: "16:00", top: 268.5, height: 203, status: "none" }] },
  { date: "Nd. 13", summary: "Dzień wolny", appointments: [] }
];

function WeekDayHeading({ day }: { day: WeekDay }) {
  return <div className={`week-day-heading${day.today ? " is-today" : ""}`}><div><strong>{day.date}</strong>{day.today ? <span>Dzisiaj</span> : null}</div><p>{day.summary}</p></div>;
}

function WeekTimeGrid() {
  return (
    <div className="week-time-grid">
      <div className="week-hour-lines" aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <div key={i} style={{ top: 7 + i * 58 }} />)}</div>
      <div className="week-time-axis">{Array.from({ length: 13 }, (_, i) => <span key={i} style={{ top: i * 58 }}>{`${i + 8}`.padStart(2, "0")}:00</span>)}</div>
      {days.map(day => <section className={`week-day-column${day.today ? " is-today" : ""}`} key={day.date} aria-label={day.date}>{day.appointments.map((appointment, i) => <ProviderCalendarAppointment key={i} appointment={appointment} />)}{day.absence ? <div className="week-absence">Nieobecność · 12:00–12:30</div> : null}</section>)}
      <img className="week-current-time" src="/figma-assets/calendar/week/current-time.svg" alt="" />
    </div>
  );
}

export function ProviderCalendarWeekPage() {
  return <ProviderShell active="Kalendarz" figmaNode="2841:2938"><section className="calendar-week-content" aria-label="Kalendarz tygodniowy — 7–13 października"><ProviderCalendarToolbar view="week" /><div className="week-day-headings"><div className="week-time-corner" />{days.map(day => <WeekDayHeading day={day} key={day.date} />)}</div><WeekTimeGrid /></section></ProviderShell>;
}
