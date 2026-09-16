import { ProviderShell } from "./provider-shell";
import { ProviderCalendarToolbar } from "./provider-calendar-toolbar";

type CalendarEvent = { label: string; tone?: "warning" };
type CalendarDay = {
  day: number;
  events?: CalendarEvent[];
  free?: boolean;
  more?: number;
  outside?: boolean;
  today?: boolean;
  total?: number;
};

const days: CalendarDay[] = [
  { day: 30, outside: true },
  { day: 1, events: [{ label: "08:45 · Sprzątanie obiektów" }] },
  { day: 2 }, { day: 3 }, { day: 4 },
  { day: 5, events: [{ label: "08:45 · Sprzątanie obiektów" }, { label: "11:30 · Sprzątanie obiektów" }], more: 2, total: 4 },
  { day: 6, free: true },
  { day: 7 }, { day: 8 }, { day: 9 },
  { day: 10, events: [{ label: "08:45 · Sprzątanie obiektów" }], total: 1 },
  { day: 11 },
  { day: 12, events: [{ label: "08:45 · Sprzątanie obiektów" }, { label: "12:30 · Sprzątanie obiektów", tone: "warning" }, { label: "16:15 · Sprzątanie obiektów" }], today: true, total: 3 },
  { day: 13, free: true },
  { day: 14, events: [{ label: "08:45 · Sprzątanie obiektów" }], total: 1 },
  { day: 15, events: [{ label: "08:45 · Sprzątanie obiektów" }, { label: "12:30 · Sprzątanie obiektów" }], total: 2 },
  { day: 16, events: [{ label: "08:45 · Sprzątanie obiektów" }], total: 1 },
  { day: 17, events: [{ label: "08:45 · Sprzątanie obiektów" }], total: 1 },
  { day: 18 },
  { day: 19, events: [{ label: "08:45 · Sprzątanie obiektów" }], total: 1 },
  { day: 20, free: true },
  { day: 21 }, { day: 22 }, { day: 23 },
  { day: 24, events: [{ label: "08:45 · Sprzątanie obiektów" }, { label: "12:30 · Sprzątanie obiektów" }], more: 2, total: 4 },
  { day: 25 },
  { day: 26, events: [{ label: "08:45 · Sprzątanie obiektów" }], total: 1 },
  { day: 27, free: true },
  { day: 28, events: [{ label: "08:45 · Sprzątanie obiektów" }], total: 1 },
  { day: 29 }, { day: 30 }, { day: 31 },
  { day: 1, outside: true }, { day: 2, outside: true }, { day: 3, free: true, outside: true }
];

function DayCell({ day }: { day: CalendarDay }) {
  const classes = ["calendar-day", day.outside ? "is-outside" : "", day.free ? "is-free" : "", day.today ? "is-today" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <div className="day-heading">
        <span className="day-number">{day.day}</span>
        <div className="day-labels">
          {day.today ? <span className="today-label">Dzisiaj</span> : null}
          {day.free ? <span className="day-status">Dzień wolny</span> : day.total ? <span className="day-status">{day.total} {day.total === 1 ? "zlecenie" : "zlecenia"}</span> : null}
        </div>
      </div>
      <div className="day-events">
        {day.events?.map((event, index) => <div className={`calendar-event${event.tone ? ` is-${event.tone}` : ""}`} key={`${event.label}-${index}`}>{event.label}</div>)}
        {day.more ? <div className="more-events">+{day.more} pozostałe zlecenia</div> : null}
      </div>
    </div>
  );
}

function MonthCalendar() {
  return (
    <section className="month-calendar" aria-label="Kalendarz na październik 2026">
      <div className="weekday-row">
        {["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"].map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="calendar-grid">{days.map((day, index) => <DayCell day={day} key={`${day.day}-${index}`} />)}</div>
    </section>
  );
}

export function ProviderCalendarPage() {
  return (
    <ProviderShell active="Kalendarz" figmaNode="2230:2266">
      <div className="calendar-content"><ProviderCalendarToolbar view="month" /><MonthCalendar /></div>
    </ProviderShell>
  );
}
