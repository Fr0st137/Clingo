"use client";

import Link from "next/link";
import { useState } from "react";
import { ProviderShell } from "./provider-shell";
import { ProviderJobEditor } from "./provider-job-editor";
import { useSettingsResource } from "./provider-settings-state";
import { offerPrice } from "../lib/provider-offers";
import { calendarDates, shiftCalendar, timeLabel, type Job } from "../lib/provider-jobs";
import { parseDay, warsawToday } from "../lib/provider-schedule";

const weekdayNames = ["PN", "WT", "ŚR", "CZ", "PT", "SB", "ND"];
const dayName = (date: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "long", timeZone: "UTC" }).format(parseDay(date));
const monthName = (date: string) => {
  const label = new Intl.DateTimeFormat("pl-PL", { month: "long", timeZone: "UTC" }).format(parseDay(date));
  return label.charAt(0).toLocaleUpperCase("pl-PL") + label.slice(1);
};

function OrderCard({ job, onEdit }: { job: Job; onEdit: () => void }) {
  return <button type="button" className={`orders-figma-card is-${job.status}`} onClick={onEdit} aria-label={`Edytuj zlecenie ${job.clientName}, ${job.date}, ${timeLabel(job.startMinute)}`}>
    <span className="orders-figma-customer"><span>{timeLabel(job.startMinute)} <span aria-hidden="true">→</span> {timeLabel(job.startMinute + job.durationMinutes)}</span><span>{job.clientName}</span></span>
    <span className="orders-figma-accent" aria-hidden="true" />
    <span className="orders-figma-service"><span>{job.serviceTitle}</span><span className="orders-figma-chips"><span>{job.durationMinutes} min</span>{job.sessionIndex && job.sessionCount && <span>Sesja {job.sessionIndex}/{job.sessionCount}</span>}{job.employeeName && <span>{job.employeeName}</span>}{job.status !== "scheduled" && <span className={`is-${job.status}`}>{job.status === "cancelled" ? "Odwołane" : "Zakończone"}</span>}</span></span>
    <strong className="orders-figma-price">{offerPrice(job.priceMinor)}</strong>
  </button>;
}

function OrdersContent() {
  const resource = useSettingsResource<Job[]>("jobs");
  const [month, setMonth] = useState(warsawToday);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [service, setService] = useState("");
  const [editor, setEditor] = useState<{ job?: Job; date: string } | null>(null);
  const [message, setMessage] = useState("");
  const jobs = resource.data ?? [];
  const services = [...new Set(jobs.map(job => job.serviceTitle))].sort((a, b) => a.localeCompare(b, "pl"));
  const monthJobs = jobs.filter(job => job.date.slice(0, 7) === month.slice(0, 7));
  const visibleJobs = monthJobs.filter(job => (status === "all" || job.status === status) && (!service || job.serviceTitle === service) && (!selectedDay || job.date === selectedDay));
  const days = [...new Set(visibleJobs.map(job => job.date))].sort();
  const calendarDays = calendarDates(month, "month");
  const today = warsawToday();
  const merge = (job: Job) => resource.setData(previous => [...(previous ?? []).filter(row => row.id !== job.id), job].sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute));
  const changeMonth = (direction: number) => { setMonth(current => shiftCalendar(current, "month", direction)); setSelectedDay(null); };

  return <section className="orders-figma-layout" aria-label="Zlecenia" data-figma-node="3931:6088">
    <aside className="orders-figma-calendar" aria-label="Kalendarz zleceń">
      <div className="orders-figma-month"><button type="button" onClick={() => changeMonth(-1)} aria-label="Poprzedni miesiąc">‹</button><strong>{monthName(month)}</strong><button type="button" onClick={() => changeMonth(1)} aria-label="Następny miesiąc">›</button></div>
      <div className="orders-figma-weekdays">{weekdayNames.map(day => <span key={day}>{day}</span>)}</div>
      <div className="orders-figma-grid">{calendarDays.map(day => {
        const count = monthJobs.filter(job => job.date === day).length;
        return <button type="button" key={day} className={`${day.slice(0, 7) !== month.slice(0, 7) ? "is-outside " : ""}${day === selectedDay ? "is-selected " : ""}${day === today ? "is-today " : ""}${count ? "has-jobs" : ""}`} onClick={() => { if (day.slice(0, 7) !== month.slice(0, 7)) setMonth(day); setSelectedDay(current => current === day ? null : day); }} aria-label={`${day}, ${count} zleceń${day === selectedDay ? ", wybrano" : ""}`} aria-pressed={day === selectedDay}>{Number(day.slice(8))}</button>;
      })}</div>
      <div className="orders-figma-calendar-links"><Link href="/orders/multi-session">Zlecenia wielosesyjne <span aria-hidden="true">›</span></Link><Link href="/orders/history">Historia zamówień <span aria-hidden="true">›</span></Link></div>
    </aside>
    <div className="orders-figma-list">
      <div className="orders-figma-toolbar"><div className="orders-figma-title"><h1>Lista zleceń</h1><span>{visibleJobs.length} {visibleJobs.length === 1 ? "zlecenie" : visibleJobs.length >= 2 && visibleJobs.length <= 4 ? "zlecenia" : "zleceń"}</span></div><div className="orders-figma-actions"><label><span className="sr-only">Status zleceń</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Wszystkie</option><option value="scheduled">Zaplanowane</option><option value="completed">Zakończone</option><option value="cancelled">Odwołane</option></select></label><label><span className="sr-only">Rodzaj usługi</span><select value={service} onChange={event => setService(event.target.value)}><option value="">Wszystkie rodzaje usług</option>{services.map(value => <option key={value} value={value}>{value}</option>)}</select></label><button type="button" className="orders-figma-add" onClick={() => setEditor({ date: selectedDay ?? today })}>Dodaj zlecenie <span aria-hidden="true">＋</span></button></div></div>
      <div className="orders-figma-scroll">
        {resource.loading && <div className="provider-state" role="status">Wczytywanie zleceń…</div>}
        {resource.error && <div className="provider-state" role="alert"><p>{resource.error}</p><button type="button" className="settings-button" onClick={resource.reload}>Spróbuj ponownie</button></div>}
        {!resource.loading && !resource.error && <>{message && <p role="status" className="provider-feedback">{message}</p>}{selectedDay && <button type="button" className="orders-figma-clear" onClick={() => setSelectedDay(null)}>Pokaż cały miesiąc ×</button>}{days.map(day => <section className="orders-figma-day" key={day} aria-label={`${dayName(day)}, ${day}`}><div className="orders-figma-date"><span>{dayName(day)}</span><strong>{Number(day.slice(8))}</strong></div><div className="orders-figma-cards">{visibleJobs.filter(job => job.date === day).sort((a, b) => a.startMinute - b.startMinute || a.id.localeCompare(b.id)).map(job => <OrderCard job={job} onEdit={() => setEditor({ job, date: job.date })} key={job.id} />)}</div></section>)}{!days.length && <div className="provider-state">Brak zleceń w wybranym okresie. Możesz wybrać inny miesiąc lub dodać zlecenie.</div>}</>}
      </div>
    </div>
    {editor && <ProviderJobEditor job={editor.job} date={editor.date} onClose={() => setEditor(null)} onReloaded={merge} onSaved={job => { merge(job); setEditor(null); setMonth(job.date); setSelectedDay(null); setStatus("all"); setService(""); setMessage("Zlecenie zostało zapisane."); }} />}
  </section>;
}

export function ProviderOrdersPage() { return <ProviderShell active="Zlecenia" live><OrdersContent /></ProviderShell>; }
