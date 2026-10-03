"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ProviderShell } from "./provider-shell";
import { ProviderJobEditor } from "./provider-job-editor";
import { ProviderCalendarToolbar } from "./provider-calendar-toolbar";
import { useSettingsResource } from "./provider-settings-state";
import { normalized } from "../lib/provider-client";
import { offerPrice } from "../lib/provider-offers";
import { parseDay, warsawToday } from "../lib/provider-schedule";
import { calendarDates, shiftCalendar, jobStatuses, timeLabel, type CalendarView, type Job } from "../lib/provider-jobs";

const weekdays = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
const dateLabel = (date: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(parseDay(date));
const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase("pl-PL") + value.slice(1);
function periodLabel(date: string, view: CalendarView) {
  const value = parseDay(date);
  if (view === "month") return capitalize(new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" }).format(value));
  if (view === "day") return capitalize(new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(value));
  const days = calendarDates(date, "week");
  if (days[0].slice(0, 7) === days[6].slice(0, 7)) {
    const month = capitalize(new Intl.DateTimeFormat("pl-PL", { month: "long", timeZone: "UTC" }).format(parseDay(days[0])));
    return `${month} ${Number(days[0].slice(8))} – ${Number(days[6].slice(8))}`;
  }
  const short = (day: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "UTC" }).format(parseDay(day));
  return `${short(days[0])} – ${short(days[6])}`;
}
const orderCountLabel = (count: number) => count === 1 ? "zlecenie" : count >= 2 && count <= 4 ? "zlecenia" : "zleceń";
const weekOrderCountLabel = (count: number) => count === 1 ? "1 zamówienie" : `${count} ${count >= 2 && count <= 4 ? "zamówienia" : "zamówień"}`;

function JobCard({ job, edit, compact = false }: { job: Job; edit: () => void; compact?: boolean }) {
  return <article className={`job-card is-${job.status}${compact ? " is-compact" : ""}`}><div className="job-card-top"><strong>{timeLabel(job.startMinute)}–{timeLabel(job.startMinute + job.durationMinutes)}</strong><span>{jobStatuses[job.status]}</span></div><h3>{job.serviceTitle}</h3><p>{job.clientName}</p><p className="team-help">{job.employeeId ? job.employeeName : "Bez przypisania pracownika"}</p>{!compact && <><p>{job.address || "Nie podano adresu klienta."}</p><div className="job-contacts">{job.clientPhone && <a href={`tel:${job.clientPhone.replace(/[^+\d]/g, "")}`}>{job.clientPhone}</a>}{job.clientEmail && <a href={`mailto:${job.clientEmail}`}>{job.clientEmail}</a>}</div>{job.notes && <p className="job-notes">{job.notes}</p>}<p><strong>{offerPrice(job.priceMinor)}</strong> · {job.durationMinutes} min</p></>}<button className="settings-button" onClick={edit}>Edytuj zlecenie<span className="sr-only"> — {job.clientName}, {job.date}, {timeLabel(job.startMinute)}</span></button></article>;
}

function MonthCalendar({ dates, month, jobs, today, onAdd, onEdit, onShowDay }: {
  dates: string[];
  month: string;
  jobs: Job[];
  today: string;
  onAdd: (date: string) => void;
  onEdit: (job: Job) => void;
  onShowDay: (date: string) => void;
}) {
  return (
    <div className="month-calendar">
      <div className="weekday-row" role="row">{weekdays.map(day => <div role="columnheader" key={day}>{day}</div>)}</div>
      <div className="calendar-grid" role="grid" aria-label={`Kalendarz: ${periodLabel(month, "month")}`} style={{ "--calendar-weeks": dates.length / 7 } as CSSProperties}>
        {dates.map(day => {
          const entries = jobs.filter(job => job.date === day).sort((a, b) => a.startMinute - b.startMinute || a.id.localeCompare(b.id));
          const visible = entries.length > 3 ? entries.slice(0, 2) : entries.slice(0, 3);
          const outside = day.slice(0, 7) !== month.slice(0, 7);
          const isToday = day === today;
          return (
            <div role="gridcell" className={`calendar-day${outside ? " is-outside" : ""}${isToday ? " is-today" : ""}`} aria-label={dateLabel(day)} key={day}>
              <div className="day-heading">
                <button type="button" className="day-number" onClick={() => onAdd(day)} aria-label={`Dodaj zlecenie — ${dateLabel(day)}`}>{Number(day.slice(8))}</button>
                <div className="day-labels">{isToday && <span className="today-label">Dzisiaj</span>}{entries.length > 0 && <span className="day-status">{entries.length} {orderCountLabel(entries.length)}</span>}</div>
              </div>
              <div className="day-events">
                {visible.map(job => <button type="button" className={`calendar-event${job.status === "cancelled" ? " is-warning" : job.status === "completed" ? " is-muted" : ""}`} onClick={() => onEdit(job)} title={`${job.clientName} — ${job.serviceTitle}`} key={job.id}>{timeLabel(job.startMinute)} · {job.serviceTitle}</button>)}
                {entries.length > visible.length && <button type="button" className="more-events" onClick={() => onShowDay(day)}>+{entries.length - visible.length} {orderCountLabel(entries.length - visible.length)}</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekAppointment({ job, onEdit }: { job: Job; onEdit: () => void }) {
  const rangeStart = Math.max(480, job.startMinute);
  const rangeEnd = Math.min(1200, job.startMinute + job.durationMinutes);
  if (rangeEnd <= rangeStart) return null;
  const top = 7 + (rangeStart - 480) * 58 / 60;
  const height = Math.max(29, (rangeEnd - rangeStart) * 58 / 60);
  const compact = job.durationMinutes <= 30 ? "30" : job.durationMinutes <= 45 ? "45" : job.durationMinutes <= 60 ? "60" : "";
  const muted = job.status === "completed";
  return <button type="button" className={`calendar-appointment calendar-live-appointment${muted ? " is-muted" : ""}${job.status === "cancelled" ? " is-warning" : ""}${compact ? ` is-compact-${compact}` : ""}`} style={{ top, height }} onClick={onEdit} aria-label={`Edytuj zlecenie: ${job.clientName}, ${timeLabel(job.startMinute)}–${timeLabel(job.startMinute + job.durationMinutes)}`}>
    <span className="calendar-appointment-copy">
      <span className="calendar-appointment-time"><span>{timeLabel(job.startMinute)}</span><img className="calendar-appointment-arrow" src="/figma-assets/calendar/week/time-arrow.svg" alt="do" /><span>{timeLabel(job.startMinute + job.durationMinutes)}</span><span className="calendar-appointment-status"><img src={`/figma-assets/calendar/week/${muted ? "status-muted.svg" : "status.svg"}`} alt="" /></span></span>
      {compact !== "30" && <span className="calendar-appointment-client">{job.clientName}</span>}
      {job.durationMinutes > 45 && <span className="calendar-appointment-service"><span>{job.serviceTitle}</span></span>}
    </span>
  </button>;
}

function WeekCalendar({ dates, jobs, today, onEdit }: { dates: string[]; jobs: Job[]; today: string; onEdit: (job: Job) => void }) {
  const dayNames = ["Pn.", "Wt.", "Śr.", "Czw.", "Pt.", "Sb.", "Nd."];
  const nowParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const nowMinute = Number(nowParts.find(part => part.type === "hour")?.value ?? 0) * 60 + Number(nowParts.find(part => part.type === "minute")?.value ?? 0);
  const showCurrentTime = dates.includes(today) && nowMinute >= 480 && nowMinute <= 1200;
  return <>
    <div className="week-day-headings" role="row">
      <div className="week-time-corner" aria-hidden="true" />
      {dates.map((day, index) => { const entries = jobs.filter(job => job.date === day); const isToday = day === today; return <div className={`week-day-heading${isToday ? " is-today" : ""}`} role="columnheader" key={day}><div><strong>{dayNames[index]} {Number(day.slice(8))}</strong>{isToday && <span>Dzisiaj</span>}</div><p>{entries.length ? weekOrderCountLabel(entries.length) : "Brak zleceń"}</p></div>; })}
    </div>
    <div className="week-time-grid" role="grid" aria-label={`Kalendarz tygodniowy: ${periodLabel(dates[0], "week")}`}>
      <div className="week-hour-lines" aria-hidden="true">{Array.from({ length: 13 }, (_, index) => <div key={index} style={{ top: 7 + index * 58 }} />)}</div>
      <div className="week-time-axis" aria-hidden="true">{Array.from({ length: 13 }, (_, index) => <span key={index} style={{ top: index * 58 }}>{String(index + 8).padStart(2, "0")}:00</span>)}</div>
      {dates.map(day => <section className={`week-day-column${day === today ? " is-today" : ""}`} role="gridcell" key={day} aria-label={dateLabel(day)}>{jobs.filter(job => job.date === day).sort((a, b) => a.startMinute - b.startMinute || a.id.localeCompare(b.id)).map(job => <WeekAppointment job={job} onEdit={() => onEdit(job)} key={job.id} />)}</section>)}
      {showCurrentTime && <img className="week-current-time" style={{ top: 7 + (nowMinute - 480) * 58 / 60 }} src="/figma-assets/calendar/week/current-time.svg" alt="Bieżąca godzina" />}
    </div>
  </>;
}

function DayAppointment({ job, onEdit }: { job: Job; onEdit: () => void }) {
  const rangeStart = Math.max(480, job.startMinute);
  const rangeEnd = Math.min(1260, job.startMinute + job.durationMinutes);
  if (rangeEnd <= rangeStart) return null;
  const top = 7 + (rangeStart - 480) * 58 / 60;
  const height = Math.max(29, (rangeEnd - rangeStart) * 58 / 60);
  const compact = height < 55;
  const muted = job.status === "completed";
  return <button type="button" className={`calendar-appointment calendar-live-appointment is-day${muted ? " is-day-muted" : ""}${job.status === "cancelled" ? " is-warning" : ""}${compact ? " is-day-compact" : ""}`} style={{ top, height }} onClick={onEdit} aria-label={`Edytuj zlecenie: ${job.clientName}, ${timeLabel(job.startMinute)}–${timeLabel(job.startMinute + job.durationMinutes)}`}>
    <span className="day-appointment-header">
      <span className="calendar-appointment-time"><span>{timeLabel(job.startMinute)}</span><img className="calendar-appointment-arrow" src="/figma-assets/calendar/day/time-arrow.svg" alt="do" /><span>{timeLabel(job.startMinute + job.durationMinutes)}</span>{job.status === "scheduled" && <img className="day-appointment-pending" src="/figma-assets/calendar/day/pending.svg" alt="Zaplanowane" />}</span>
      {job.employeeId && <img className="day-appointment-avatar" src="/figma-assets/calendar/day/avatar.png" alt={job.employeeName} />}
    </span>
    {!compact && <span className="calendar-appointment-client">{job.clientName}</span>}
    {height >= 85 && <span className="day-appointment-service">{job.serviceTitle}</span>}
    {height >= 130 && job.address && <span className="day-appointment-address"><img src="/figma-assets/calendar/day/map.svg" alt="" /><span>{job.address}</span></span>}
  </button>;
}

function DayCalendar({ date, jobs, today, onEdit }: { date: string; jobs: Job[]; today: string; onEdit: (job: Job) => void }) {
  const entries = jobs.filter(job => job.date === date && job.startMinute < 1260 && job.startMinute + job.durationMinutes > 480).sort((a, b) => a.startMinute - b.startMinute || b.durationMinutes - a.durationMinutes || a.id.localeCompare(b.id));
  const columns: Job[][] = [];
  const columnEnds: number[] = [];
  for (const job of entries) {
    const index = columnEnds.findIndex(end => end <= job.startMinute);
    const target = index === -1 ? columns.length : index;
    if (!columns[target]) columns[target] = [];
    columns[target].push(job);
    columnEnds[target] = job.startMinute + job.durationMinutes;
  }
  const nowParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const nowMinute = Number(nowParts.find(part => part.type === "hour")?.value ?? 0) * 60 + Number(nowParts.find(part => part.type === "minute")?.value ?? 0);
  const showCurrentTime = date === today && nowMinute >= 480 && nowMinute <= 1260;
  return <div className="day-time-grid" role="grid" aria-label={`Kalendarz dzienny: ${dateLabel(date)}`}>
    <div className="day-time-lines" aria-hidden="true">{Array.from({ length: 53 }, (_, index) => <i className={index % 4 === 0 ? "is-hour" : ""} style={{ top: 7 + index * 14.5 }} key={index} />)}</div>
    <div className="day-time-axis" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <span style={{ top: index * 58 }} key={index}>{String(index + 8).padStart(2, "0")}:00</span>)}</div>
    <div className="day-appointment-columns">
      {columns.map((column, index) => <section className="day-appointment-column" role="gridcell" aria-label={`Kolumna ${index + 1}`} key={index}>{column.map(job => <DayAppointment job={job} onEdit={() => onEdit(job)} key={job.id} />)}</section>)}
    </div>
    {showCurrentTime && <img className="day-current-time" style={{ top: 7 + (nowMinute - 480) * 58 / 60 }} src="/figma-assets/calendar/day/current-time.svg" alt="Bieżąca godzina" />}
  </div>;
}

function JobsContent({ calendar, initialView = "month", history = false, initialEditId }: { calendar?: boolean; initialView?: CalendarView; history?: boolean; initialEditId?: string }) {
  const resource = useSettingsResource<Job[]>("jobs");
  const [date, setDate] = useState(warsawToday), [view, setView] = useState<CalendarView>(initialView);
  const [query, setQuery] = useState(""), [employee, setEmployee] = useState(""), [service, setService] = useState(""), [status, setStatus] = useState(history ? "history" : calendar ? "all" : "scheduled");
  const [editor, setEditor] = useState<{ job?: Job; date: string } | null>(null), [message, setMessage] = useState(""), [editError, setEditError] = useState("");
  const opened = useRef(false);
  useEffect(() => { if (!resource.data || opened.current) return; opened.current = true; const id = initialEditId ?? new URLSearchParams(window.location.search).get("edit"); if (id) { const job = resource.data.find(row => row.id === id); if (job) setEditor({ job, date: job.date }); else setEditError("Nie znaleziono zlecenia w Twojej działalności."); } }, [resource.data, initialEditId]);
  const jobs = resource.data ?? [];
  const employees = Array.from(new Map(jobs.filter(job => job.employeeId).map(job => [job.employeeId!, job.employeeName])).entries()).sort((a, b) => a[1].localeCompare(b[1], "pl"));
  const services = Array.from(new Set(jobs.map(job => job.serviceTitle))).sort((a, b) => a.localeCompare(b, "pl"));
  const filtered = jobs.filter(job => (status === "all" || status === "history" && job.status !== "scheduled" || status === "visible" && job.status !== "cancelled" || status === job.status) && (!employee || employee === "unassigned" && !job.employeeId || job.employeeId === employee) && (!service || job.serviceTitle === service) && normalized(`${job.clientName} ${job.serviceTitle} ${job.address} ${job.employeeName}`).includes(normalized(query.trim())));
  const dates = calendar ? calendarDates(date, view) : Array.from(new Set(filtered.map(job => job.date))).sort((a, b) => history ? b.localeCompare(a) : a.localeCompare(b));
  function merge(job: Job) { resource.setData(previous => [...(previous ?? []).filter(row => row.id !== job.id), job].sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute || a.id.localeCompare(b.id))); }
  const title = history ? "Historia zleceń" : "Zlecenia";
  const openEditor = (job: Job) => { setMessage(""); setEditor({ job, date: job.date }); };

  if (resource.loading || resource.error) return <div className="provider-state" role={resource.error ? "alert" : "status"}>{resource.loading ? "Wczytywanie zleceń…" : <><p>{resource.error}</p><button className="settings-button" onClick={resource.reload}>Spróbuj ponownie</button></>}</div>;

  if (calendar) return <section className={`${view === "week" ? "calendar-week-content" : view === "day" ? "calendar-day-content" : "calendar-content"} jobs-calendar-live`}>
    <ProviderCalendarToolbar view={view} periodLabel={periodLabel(date, view)} services={services} service={service} onViewChange={setView} onPrevious={() => setDate(shiftCalendar(date, view, -1))} onNext={() => setDate(shiftCalendar(date, view, 1))} onServiceChange={setService} onAdd={() => { setMessage(""); setEditor({ date }); }} onRefresh={() => { setMessage(""); resource.reload(); }} />
    {view === "month" ? <MonthCalendar dates={dates} month={date} jobs={filtered} today={warsawToday()} onAdd={day => setEditor({ date: day })} onEdit={openEditor} onShowDay={day => { setDate(day); setView("day"); }} /> : view === "week" ? <WeekCalendar dates={dates} jobs={filtered} today={warsawToday()} onEdit={openEditor} /> : <DayCalendar date={date} jobs={filtered} today={warsawToday()} onEdit={openEditor} />}
    {message && <p role="status" className="sr-only">{message}</p>}{editError && <p role="alert" className="provider-feedback is-error calendar-error">{editError}</p>}
    {editor && <ProviderJobEditor job={editor.job} date={editor.date} onClose={() => setEditor(null)} onReloaded={merge} onSaved={job => { merge(job); setEditor(null); setDate(job.date); setStatus("all"); setService(""); setMessage("Zlecenie zostało zapisane."); }} />}
  </section>;

  return <section className="jobs-live"><div className="jobs-heading"><h1>{title}</h1><div><Link className="settings-button" href={history ? "/orders" : "/orders/history"}>{history ? "Zaplanowane zlecenia" : "Historia"}</Link><button className="employee-save-button" onClick={() => { setMessage(""); setEditor({ date }); }}>Dodaj zlecenie</button></div></div>
    <p className="provider-feedback">Zlecenia wpisane ręcznie w tej działalności. Rezerwacje z publicznego katalogu nie są jeszcze połączone z panelem. Kwoty zleceń nie potwierdzają otrzymania płatności.</p>
    <div className="jobs-filters"><label className="settings-live-field"><span>Szukaj zlecenia</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Klient, usługa, adres" /></label><label className="settings-live-field"><span>Filtr pracownika</span><select value={employee} onChange={event => setEmployee(event.target.value)}><option value="">Wszyscy</option><option value="unassigned">Bez przypisania</option>{employees.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label><label className="settings-live-field"><span>Filtr statusu</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Wszystkie</option>{history && <option value="history">Zakończone i odwołane</option>}{Object.entries(jobStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="settings-button" onClick={() => { setMessage(""); resource.reload(); }}>Odśwież</button></div>
    {message && <p role="status" className="provider-feedback">{message}</p>}{editError && <p role="alert" className="provider-feedback is-error">{editError}</p>}
    <p className="team-help" aria-live="polite">Zlecenia w widoku: {filtered.length}. Terminy według czasu polskiego.</p>
    <div className="jobs-days">{dates.map(day => { const entries = filtered.filter(job => job.date === day); return <section className={`jobs-day${day === warsawToday() ? " is-today" : ""}`} key={day} aria-label={dateLabel(day)}><div className="jobs-day-heading"><h2>{dateLabel(day)}</h2></div>{entries.map(job => <JobCard key={job.id} job={job} edit={() => openEditor(job)} />)}</section>; })}</div>
    {!dates.length && <div className="provider-state">Brak zleceń dla wybranych filtrów.</div>}
    {editor && <ProviderJobEditor job={editor.job} date={editor.date} onClose={() => setEditor(null)} onReloaded={merge} onSaved={job => { merge(job); setEditor(null); setQuery(""); setEmployee(""); setDate(job.date); setStatus(job.status); setMessage("Zlecenie zostało zapisane."); }} />}
  </section>;
}

export function ProviderJobsPage(props: { calendar?: boolean; initialView?: CalendarView; history?: boolean; initialEditId?: string }) {
  const figmaNode = props.calendar ? props.initialView === "week" ? "2841:2938" : props.initialView === "day" ? "2878:4207" : "2230:2266" : undefined;
  return <ProviderShell active={props.calendar ? "Kalendarz" : "Zlecenia"} figmaNode={figmaNode} live><JobsContent {...props} /></ProviderShell>;
}
