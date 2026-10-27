"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { TeamState, useEmployees } from "./provider-team-data";
import { initials } from "../lib/provider-client";
import { parseDay } from "../lib/provider-schedule";
import { providerApi } from "../lib/provider-client";

const asset = (name: string) => `/figma-assets/calendar/absence/${name}`;
const dateLabel = (day: string) => day ? new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parseDay(day)).replace(/\./g, "") : "Wybierz datę";

function DateTimeFields({ label, day, time, onDay, onTime }: { label: string; day: string; time: string; onDay: (value: string) => void; onTime: (value: string) => void }) {
  return <div className="absence-period">
    <h3>{label}</h3>
    <div className="absence-datetime">
      <label className="absence-control absence-date"><span>{dateLabel(day)}</span><img src={asset("calendar.svg")} alt="" /><input aria-label={`${label} — data`} type="date" required value={day} onChange={event => onDay(event.target.value)} onClick={event => event.currentTarget.showPicker?.()} /></label>
      <label className="absence-control absence-time"><span>{time || "Godzina"}</span><img src={asset("clock.svg")} alt="" /><input aria-label={`${label} — godzina`} type="time" required step={900} value={time} onChange={event => onTime(event.target.value)} onClick={event => event.currentTarget.showPicker?.()} /></label>
    </div>
  </div>;
}

export function ProviderAbsenceForm({ date, onBack }: { date: string; onBack: () => void }) {
  const team = useEmployees();
  const [startDate, setStartDate] = useState(date), [endDate, setEndDate] = useState(date);
  const [startTime, setStartTime] = useState("12:30"), [endTime, setEndTime] = useState("13:30");
  const [reason, setReason] = useState(""), [selected, setSelected] = useState<string[]>([]);
  const [all, setAll] = useState(false), [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  function toggle(id: string) {
    const current = all ? team.employees.map(employee => employee.id) : selected;
    setAll(false);
    setSelected(current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (`${endDate}T${endTime}` <= `${startDate}T${startTime}`) return setError("Koniec nieobecności musi przypadać po jej początku.");
    if (!team.employees.length || (!all && !selected.length)) return setError("Wybierz co najmniej jednego pracownika.");
    if (saving) return;
    setSaving(true); setError("");
    try {
      await providerApi("absences", "POST", { start: `${startDate}T${startTime}`, end: `${endDate}T${endTime}`, reason, employeeIds: all ? team.employees.map(row => row.id) : selected });
      window.dispatchEvent(new Event("provider-bookings-changed"));
      window.dispatchEvent(new Event("provider-absences-changed"));
      onBack();
    } catch (error) { setError((error as Error).message); }
    finally { setSaving(false); }
  }
  return <form className="absence-form" onSubmit={submit} onChange={() => setError("")}>
    <div className="order-type-heading">
      <h2 id="absence-title" tabIndex={-1} ref={heading}>Nieobecność (urlop, choroba, inne...)</h2>
      <p id="absence-description">Nieobecność wyłącza wybranych pracowników z nowych rezerwacji w podanym terminie. Pozostali dostępni pracownicy nadal mogą przyjmować zlecenia.</p>
    </div>
    <DateTimeFields label="Wybierz datę początku" day={startDate} time={startTime} onDay={setStartDate} onTime={setStartTime} />
    <DateTimeFields label="Wybierz datę końca" day={endDate} time={endTime} onDay={setEndDate} onTime={setEndTime} />
    <label className="absence-reason"><span>Wybierz powód</span><span className={`absence-control${reason ? "" : " is-placeholder"}`}><span>{reason || "Powód nieobecności"}</span><img src={asset("dropdown.svg")} alt="" /><select aria-label="Powód nieobecności" required value={reason} onChange={event => setReason(event.target.value)}><option value="" disabled>Powód nieobecności</option>{["Urlop na żądanie", "Urlop wypoczynkowy", "Szkolenie", "L4", "Inne"].map(value => <option key={value}>{value}</option>)}</select></span></label>
    <div className="absence-employees" role="group" aria-labelledby="absence-employees-label">
      <h3 id="absence-employees-label">Wybierz pracownika</h3>
      <TeamState {...team} />
      {!team.loading && !team.error && <div className="absence-employee-list">
        <button type="button" className="absence-employee" aria-pressed={all} onClick={() => { setAll(value => !value); setSelected([]); setError(""); }} disabled={!team.employees.length}><img className="absence-avatar" src={asset("all-employees.png")} alt="" /><span>Wszyscy<br />Pracownicy</span></button>
        {team.employees.map(employee => <button type="button" className="absence-employee" key={employee.id} aria-pressed={all || selected.includes(employee.id)} onClick={() => { toggle(employee.id); setError(""); }}><span className="absence-avatar absence-initials" aria-hidden="true">{initials(employee.name)}</span><span>{employee.name.split(/\s+/).map((part, index) => <span key={index}>{part}</span>)}</span></button>)}
        {!team.employees.length && <p className="team-help">Brak pracowników. Dodaj pracownika, aby zaplanować nieobecność.</p>}
      </div>}
    </div>
    <p className="absence-notice"><strong>UWAGA!</strong><br />Zablokowany termin nie powoduje anulowania już istniejących. Wcześniej utworzone zlecenia należy anulować ręcznie w ich szczegółach.</p>
    {error && <p className="provider-feedback is-error" role="alert">{error}</p>}
    <div className="order-action-buttons absence-actions"><button type="button" disabled={saving} onClick={onBack}>Cofnij</button><button className="is-primary" type="submit" disabled={saving || team.loading || !!team.error}>{saving ? "Zapisywanie…" : "Dodaj nieobecność"}</button></div>
  </form>;
}
