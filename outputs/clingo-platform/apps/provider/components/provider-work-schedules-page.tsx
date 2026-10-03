"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProviderShell } from "./provider-shell";
import { TeamState, useEmployees } from "./provider-team-data";
import { dayMinutes, hoursLabel, initials, weekMinutes } from "../lib/provider-client";
import { monthMinutes, parseDay, scheduleCsv, scheduleOn, shiftDate, warsawToday, weekDates } from "../lib/provider-schedule";

function Schedules() {
  const state = useEmployees();
  const [date, setDate] = useState(warsawToday);
  const [view, setView] = useState<"day" | "week">("day");
  const [selected, setSelected] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  useEffect(() => { setSelected(new URLSearchParams(window.location.search).get("employee") ?? ""); }, []);
  const employees = state.employees.filter(employee => (!selected || employee.id === selected) && (employee.showInCalendar || showHidden || employee.id === selected));
  const dates = view === "week" ? weekDates(date) : [date];
  function download() {
    const url = URL.createObjectURL(new Blob([scheduleCsv(employees, dates)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `grafik-${dates[0]}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="work-schedules-content">
    <div className="schedule-toolbar">
      <div className="schedule-view-switcher"><button type="button" className={view === "day" ? "is-active" : ""} aria-pressed={view === "day"} onClick={() => setView("day")}>Dzień</button><button type="button" className={view === "week" ? "is-active" : ""} aria-pressed={view === "week"} onClick={() => setView("week")}>Tydzień</button></div>
      <div className="schedule-date-switcher"><button type="button" aria-label={view === "day" ? "Poprzedni dzień" : "Poprzedni tydzień"} onClick={() => setDate(shiftDate(date, view === "day" ? -1 : -7))}>←</button><label>Data<input type="date" value={date} required onChange={event => { if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) setDate(event.target.value); }} /></label><button type="button" aria-label={view === "day" ? "Następny dzień" : "Następny tydzień"} onClick={() => setDate(shiftDate(date, view === "day" ? 1 : 7))}>→</button><button type="button" onClick={() => setDate(warsawToday())}>Dzisiaj</button></div>
      <div className="schedule-actions"><button type="button" onClick={download} disabled={state.loading || !!state.error || !employees.length}>Pobierz CSV</button><Link className="employee-add-button" href="/employees/add">Dodaj pracownika</Link></div>
    </div>
    <div className="team-schedule-filters"><label>Pracownik<select value={selected} onChange={event => setSelected(event.target.value)}><option value="">Wszyscy pracownicy</option>{state.employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label><label className="team-checkbox"><input type="checkbox" checked={showHidden} onChange={event => setShowHidden(event.target.checked)} />Pokaż również ukrytych</label></div>
    <p className="team-help">Stały tygodniowy grafik pracy. Podsumowania pokazują zaplanowane godziny, bez obłożenia zleceniami i nieobecności. Daty według czasu polskiego.</p>
    <TeamState {...state} />
    {!state.loading && !state.error && (!employees.length ? <div className="provider-state"><p>{state.employees.length ? "Brak pracowników dla wybranych filtrów." : "Dodaj pracowników, aby zobaczyć ich grafiki."}</p><Link href="/employees">Przejdź do pracowników</Link></div> : <div className="team-schedule-scroll"><table className="team-schedule-table"><caption>{view === "day" ? `Grafik na ${date}` : `Grafik od ${dates[0]} do ${dates[6]}`}</caption><thead><tr><th scope="col">Pracownik</th>{dates.map(day => <th key={day} scope="col">{new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(parseDay(day))}</th>)}<th scope="col">Podsumowanie</th><th scope="col">Edycja</th></tr></thead><tbody>{employees.map(employee => <tr key={employee.id}><th scope="row"><span className="team-person"><span className="employee-initials">{initials(employee.name)}</span>{employee.name}</span></th>{dates.map(date => { const day = scheduleOn(employee, date); return <td key={date}><span className={day.enabled ? "team-shift" : "team-day-off"}>{day.enabled ? `${day.start} – ${day.end}` : "Wolne"}</span>{day.enabled && <small>{hoursLabel(dayMinutes(day))}</small>}</td>; })}<td><span className="team-hours-summary">Tydzień: {hoursLabel(weekMinutes(employee))}<br />Miesiąc: {hoursLabel(monthMinutes(employee, date))}</span></td><td><Link href={`/employees/edit?id=${employee.id}`} aria-label={`Edytuj grafik — ${employee.name}`}>Edytuj grafik</Link></td></tr>)}</tbody></table></div>)}
  </section>;
}
export function ProviderWorkSchedulesPage() { return <ProviderShell active="Grafiki pracy" figmaNode="5754:9661"><Schedules /></ProviderShell>; }
