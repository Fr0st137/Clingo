import { weekCalendarDays as days, type WeekDay } from "./provider-orders-data";
import { ProviderCalendarAppointment } from "./provider-calendar-appointment";
import { ProviderCalendarToolbar } from "./provider-calendar-toolbar";
import { ProviderShell } from "./provider-shell";

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
