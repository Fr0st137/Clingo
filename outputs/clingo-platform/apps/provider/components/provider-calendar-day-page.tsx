import { dayCalendarColumns as columns } from "./provider-orders-data";
import { ProviderCalendarAppointment } from "./provider-calendar-appointment";
import { ProviderCalendarToolbar } from "./provider-calendar-toolbar";
import { ProviderShell } from "./provider-shell";

function DayTimeGrid() {
  return <div className="day-time-grid"><div className="day-time-lines" aria-hidden="true">{Array.from({ length: 53 }, (_, i) => <i className={i % 4 === 0 ? "is-hour" : ""} key={i} style={{ top: 7 + i * 14.5 }} />)}</div><div className="day-time-axis">{Array.from({ length: 14 }, (_, i) => <span key={i} style={{ top: i * 58 }}>{String(i + 8).padStart(2, "0")}:00</span>)}</div><div className="day-appointment-columns">{columns.map((appointments, i) => <section className="day-appointment-column" aria-label={`Kolumna zleceń ${i + 1}`} key={i}>{appointments.map(appointment => <ProviderCalendarAppointment appointment={appointment} variant="day" key={appointment.client} />)}</section>)}</div><img className="day-current-time" src="/figma-assets/calendar/day/current-time.svg" alt="Bieżący czas: 15:00" /></div>;
}

export function ProviderCalendarDayPage() {
  return <ProviderShell active="Kalendarz" figmaNode="2878:4207"><section className="calendar-day-content" aria-label="Kalendarz dzienny — sobota, 13 października"><ProviderCalendarToolbar view="day" /><DayTimeGrid /></section></ProviderShell>;
}
