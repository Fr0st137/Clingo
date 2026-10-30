"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProviderShell } from "./provider-shell";
import { ProviderAbsenceDialog } from "./provider-absence-dialog";
import { TeamState, useEmployees } from "./provider-team-data";
import { dayMinutes, hoursLabel, initials, minutes, weekMinutes } from "../lib/provider-client";
import { monthMinutes, parseDay, scheduleCsv, scheduleOn, shiftDate, warsawToday, weekDates } from "../lib/provider-schedule";

const asset = (name: string) => `/figma-assets/work-schedules/${name}.svg`;
const dateLabel = (date: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(parseDay(date));
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

function Schedules() {
  const state = useEmployees();
  const [date, setDate] = useState(warsawToday);
  const [view, setView] = useState<"day" | "week">("day");
  const [selected, setSelected] = useState("");
  const [scrollLeft, setScrollLeft] = useState(0);
  const [absenceOpen, setAbsenceOpen] = useState(false);
  useEffect(() => { setSelected(new URLSearchParams(window.location.search).get("employee") ?? ""); }, []);
  const employees = state.employees.filter(employee => (!selected || employee.id === selected) && (employee.showInCalendar || employee.id === selected));
  const dates = view === "week" ? weekDates(date) : [date];
  // Include saved shifts outside the design's standard 08:00–20:00 range.
  const shifts = employees.flatMap(employee => dates.map(day => scheduleOn(employee, day))).filter(day => day.enabled);
  const startHour = Math.min(8, ...shifts.map(day => Math.floor(minutes(day.start) / 60)));
  const endHour = Math.max(20, ...shifts.map(day => Math.ceil(minutes(day.end) / 60)));
  const timelineWidth = (endHour - startHour) * 100;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  function download() {
    const url = URL.createObjectURL(new Blob([scheduleCsv(employees, dates)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `grafik-${dates[0]}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="work-schedules-content schedules-figma" aria-label="Grafiki pracy">
    <div className="schedule-toolbar">
      <div className="schedule-view-switcher">{(["day", "week"] as const).map(value => <button key={value} type="button" className={view === value ? "is-active" : ""} aria-pressed={view === value} onClick={() => { setView(value); setScrollLeft(0); }}>{value === "day" ? "Dzień" : "Tydzień"}</button>)}</div>
      <div className="schedule-date-switcher">
        <button className="schedule-date-arrow is-previous" type="button" aria-label={view === "day" ? "Poprzedni dzień" : "Poprzedni tydzień"} onClick={() => setDate(shiftDate(date, view === "day" ? -1 : -7))}><img src={asset("angle")} alt="" /></button>
        <label className="schedule-date-value"><strong>{view === "day" ? dateLabel(date) : new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "UTC" }).formatRange(parseDay(dates[0]), parseDay(dates[6]))}</strong><span>{hourLabel(startHour)} - {hourLabel(endHour)}</span><input type="date" aria-label="Wybierz datę grafiku" value={date} required onChange={event => { if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) setDate(event.target.value); }} /></label>
        <button className="schedule-date-arrow is-next" type="button" aria-label={view === "day" ? "Następny dzień" : "Następny tydzień"} onClick={() => setDate(shiftDate(date, view === "day" ? 1 : 7))}><img src={asset("angle")} alt="" /></button>
      </div>
      <div className="schedule-actions">
        <button type="button" disabled title="Kopiowanie grafików na konkretne daty nie jest jeszcze dostępne"><img src={asset("copy")} alt="" />Skopiuj na inne dni</button>
        <button type="button" onClick={download} disabled={state.loading || !!state.error || !employees.length}><img src={asset("download")} alt="" />Pobierz</button>
        <button className="schedule-absence" type="button" aria-haspopup="dialog" aria-expanded={absenceOpen} onClick={() => setAbsenceOpen(true)}>Nieobecność<img src={asset("plus")} alt="" /></button>
      </div>
    </div>
    <div className={`schedule-scale ${view === "week" ? "is-week" : ""}`} aria-hidden="true"><div style={{ transform: `translateX(-${scrollLeft}px)`, width: view === "day" ? timelineWidth : 7 * 180 }}>{view === "day" ? hours.map(hour => <span key={hour}>{hourLabel(hour)}</span>) : dates.map(day => <span key={day}>{dateLabel(day)}</span>)}</div></div>
    <TeamState {...state} />
    {!state.loading && !state.error && <div className="schedule-board-viewport"><div className="schedule-board">
      <div className="schedule-employees">
        {employees.map(employee => <div className="schedule-employee-row" key={employee.id}>
          <div className="schedule-employee-person"><span className="schedule-avatar">{initials(employee.name)}</span><span>{employee.name}</span></div>
          <div className="schedule-employee-summary" title="Zaplanowane godziny pracy"><span>Dzień: {hoursLabel(dayMinutes(scheduleOn(employee, date)))}</span><span>Tydzień: {hoursLabel(weekMinutes(employee))}</span><span>Miesiąc: {hoursLabel(monthMinutes(employee, date))}</span></div>
          <Link className="schedule-employee-edit" href={`/employees/edit?id=${employee.id}`} aria-label={`Edytuj grafik — ${employee.name}`}><img src={asset("pencil")} alt="" /></Link>
        </div>)}
        {!employees.length && <div className="schedule-empty"><p>{state.employees.length ? "Brak widocznych pracowników." : "Dodaj pracowników, aby zobaczyć ich grafiki."}</p><Link href="/employees">Przejdź do pracowników</Link></div>}
        {selected && <button className="schedule-show-all" type="button" onClick={() => setSelected("")}>Pokaż wszystkich pracowników</button>}
      </div>
      <div key={view} className="schedule-timeline-scroll" onScroll={event => setScrollLeft(event.currentTarget.scrollLeft)} tabIndex={0} role="region" aria-label={view === "day" ? `Oś czasu — ${dateLabel(date)}` : "Grafik tygodniowy"}>
        <div className={`schedule-timeline ${view === "week" ? "is-week" : ""}`} style={{ width: view === "day" ? timelineWidth : 7 * 180 }}>
          {employees.map(employee => <div className="schedule-timeline-row" key={employee.id} aria-label={employee.name}>
            {view === "day" ? (() => { const day = scheduleOn(employee, date); return day.enabled ? <Link className="shift-bar" style={{ left: (minutes(day.start) - startHour * 60) * 100 / 60 + 1, width: Math.max(2, dayMinutes(day) * 100 / 60 - 2) }} href={`/employees/edit?id=${employee.id}`} aria-label={`${employee.name}: ${day.start} – ${day.end}. Edytuj grafik`}><span>{day.start} - {day.end}</span><img src={asset("pencil")} alt="" /></Link> : <span className="schedule-day-off">Wolne</span>; })() : dates.map(dayDate => { const day = scheduleOn(employee, dayDate); return <div className="schedule-week-cell" key={dayDate}>{day.enabled ? <Link className="schedule-week-shift" href={`/employees/edit?id=${employee.id}`} aria-label={`${employee.name}, ${dateLabel(dayDate)}: ${day.start} – ${day.end}. Edytuj grafik`}>{day.start} - {day.end}<img src={asset("pencil")} alt="" /></Link> : <span className="schedule-day-off">Wolne</span>}</div>; })}
          </div>)}
        </div>
      </div>
    </div></div>}
    {absenceOpen && <ProviderAbsenceDialog date={date} onClose={() => setAbsenceOpen(false)} />}
  </section>;
}
export function ProviderWorkSchedulesPage() { return <ProviderShell active="Grafiki pracy" figmaNode="5754:9678"><Schedules /></ProviderShell>; }
