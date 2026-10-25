"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SettingsLoadState, useSettingsResource } from "./provider-settings-state";
import { providerApi } from "../lib/provider-client";

const asset = (name: string) => `/figma-assets/calendar/absence/${name}`;
type Absence = { id: string; revision: number; number: number; employees: string[]; start: string; end: string; status: "ongoing" | "upcoming" | "completed" };
const dateLabel = (value: string) => `${new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}:00Z`))}, ${value.slice(11)}`;
const months = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat("pl-PL", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2025, index, 1))));

function FilterSelect({ label, value, onChange, children, sort = false }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; sort?: boolean }) {
  return <span className={`absence-list-select${sort ? " is-sort" : ""}`}>
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className={value ? "has-value" : ""}>{children}</select>
    <img src={asset(sort ? "sort-dropdown.svg" : "filter-dropdown.svg")} alt="" />
  </span>;
}

export function ProviderAbsenceManager({ history = false }: { history?: boolean }) {
  const resource = useSettingsResource<Absence[]>("absences");
  const rows = (resource.data ?? []).filter(row => history ? row.status === "completed" : row.status !== "completed");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [number, setNumber] = useState(""), [year, setYear] = useState(""), [month, setMonth] = useState(""), [employee, setEmployee] = useState(""), [sort, setSort] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [removed, setRemoved] = useState<Absence | null>(null);
  const heading = useRef<HTMLHeadingElement>(null), scroll = useRef<HTMLDivElement>(null);
  const [scrollRatio, setScrollRatio] = useState(0), [thumbRatio, setThumbRatio] = useState(1);
  useEffect(() => { heading.current?.focus(); }, [resource.loading]);
  const employees = Array.from(new Set(rows.flatMap(row => row.employees))).sort((a, b) => a.localeCompare(b, "pl"));
  const years = Array.from(new Set(rows.flatMap(row => [row.start.slice(0, 4), row.end.slice(0, 4)]))).sort();
  const filtered = rows.filter(row => (!number || String(row.number).includes(number.trim())) && (!employee || row.employees.includes(employee)) && (!year || row.start.slice(0, 4) <= year && row.end.slice(0, 4) >= year) && (!month || (() => {
    const candidates = year ? [year] : years;
    return candidates.some(value => row.start.slice(0, 7) <= `${value}-${month}` && row.end.slice(0, 7) >= `${value}-${month}`);
  })()));
  const visible = [...filtered].sort((a, b) => sort === "start-asc" ? a.start.localeCompare(b.start) : sort === "start-desc" ? b.start.localeCompare(a.start) : sort === "number" ? b.number - a.number : 0);
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const measure = () => { setThumbRatio(Math.min(1, el.clientHeight / Math.max(1, el.scrollHeight))); setScrollRatio(el.scrollHeight > el.clientHeight ? el.scrollTop / (el.scrollHeight - el.clientHeight) : 0); };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [visible.length, expanded]);
  function resetScroll() { scroll.current?.scrollTo({ top: 0 }); }
  function change(setter: (value: string) => void) { return (value: string) => { setter(value); setExpanded(null); resetScroll(); }; }
  async function cancel(row: Absence, cancelled: boolean) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await providerApi<{ revision: number }>(`absences/${row.id}`, "PUT", { cancelled, revision: row.revision });
      if (cancelled) {
        resource.setData(current => (current ?? []).filter(item => item.id !== row.id));
        setRemoved({ ...row, revision: result.revision }); setExpanded(null);
      } else {
        resource.setData(current => [...(current ?? []), { ...row, revision: result.revision }].sort((a, b) => b.number - a.number));
        setRemoved(null);
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Nie udało się zmienić nieobecności."); }
    finally { setBusy(false); }
  }
  if (resource.loading || resource.error) return <><div className="order-type-heading"><h2 id="absence-title">{history ? "Historia nieobecnościami" : "Zarządzaj nieobecnościami"}</h2><p id="absence-description">Zaplanuj lub zarządzaj nieobecnościami w kalendarzu.</p></div><SettingsLoadState loading={resource.loading} error={resource.error} retry={resource.reload} /></>;
  return <>
    <div className="order-type-heading">
      <h2 id="absence-title" ref={heading} tabIndex={-1}>{history ? "Historia nieobecnościami" : "Zarządzaj nieobecnościami"}</h2>
      <p id="absence-description">Zaplanuj lub zarządzaj nieobecnościami w kalendarzu.</p>
    </div>
    <div className="absence-list-toolbar">
      <div className="absence-list-filters">
        <label className="absence-list-filter"><span>Numer</span><span className="absence-number-search"><img src={asset("search.svg")} alt="" /><input aria-label="Numer nieobecności" type="search" inputMode="numeric" value={number} onChange={event => change(setNumber)(event.target.value)} /></span></label>
        <div className="absence-list-filter"><span>Filtruj według daty</span><div className="absence-date-filters"><FilterSelect label="Rok" value={year} onChange={change(setYear)}><option value="">Rok</option>{years.map(value => <option key={value}>{value}</option>)}</FilterSelect><FilterSelect label="Miesiąc" value={month} onChange={change(setMonth)}><option value="">Miesiąc</option>{months.map((name, index) => <option key={name} value={String(index + 1).padStart(2, "0")}>{name}</option>)}</FilterSelect></div></div>
        <label className="absence-list-filter absence-employee-filter"><span>Pracownik</span><FilterSelect label="Pracownik" value={employee} onChange={change(setEmployee)}><option value="">Wybierz</option>{employees.map(name => <option key={name}>{name}</option>)}</FilterSelect></label>
      </div>
      <FilterSelect label="Sortowanie" value={sort} onChange={change(setSort)} sort><option value="">Sortowanie: Domyślne</option><option value="start-asc">Termin: od najbliższego</option><option value="start-desc">Termin: od najdalszego</option><option value="number">Numer: malejąco</option></FilterSelect>
    </div>
    <div className="absence-table-frame">
      <div className="absence-table-scroll" tabIndex={0} role="region" aria-label={history ? "Historia nieobecności" : "Lista aktywnych nieobecności"} ref={scroll} onScroll={event => { const el = event.currentTarget; setScrollRatio(el.scrollHeight > el.clientHeight ? el.scrollTop / (el.scrollHeight - el.clientHeight) : 0); }}>
        <table className="absence-table">
          <thead><tr>{["Numer", "Pracownicy", "Termin początkowy “Od”", "Termin końcowy “Do”", "Status", ...history ? [] : ["Działania"]].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{visible.map(row => <tr key={row.number}>
            <td>{row.number}</td>
            <td>{row.employees.length > 1 ? <><button type="button" className="absence-names" aria-expanded={expanded === row.number} onClick={() => setExpanded(expanded === row.number ? null : row.number)} aria-label={`Pracownicy nieobecności ${row.number}: ${row.employees.join(", ")}`}>{row.employees[0]}, +{row.employees.length - 1}</button>{expanded === row.number && <div className="absence-names-detail">{row.employees.join(", ")}</div>}</> : row.employees[0]}</td>
            <td>{dateLabel(row.start)}</td><td>{dateLabel(row.end)}</td>
            <td><span className={`absence-status is-${history ? "completed" : row.status}`}>{history ? "Zakończona" : row.status === "ongoing" ? "W toku" : "Zapowiedziana"}</span></td>
            {!history && <td><button type="button" className="absence-delete" disabled={busy} aria-label={`Usuń nieobecność ${row.number}`} onClick={() => void cancel(row, true)}>Usuń<img src={asset("trash.svg")} alt="" /></button></td>}
          </tr>)}</tbody>
        </table>
        {!visible.length && <p className="absence-list-empty" role="status">Brak nieobecności spełniających wybrane kryteria.</p>}
      </div>
      <div className="absence-scrollbar">
        <button type="button" aria-label="Przewiń listę w górę" onClick={() => scroll.current?.scrollBy({ top: -150, behavior: "smooth" })}><img src={asset("scroll-up.svg")} alt="" /></button>
        <div className="absence-scrollbar-track" onClick={event => { const el = scroll.current; if (el) el.scrollTo({ top: (event.clientY - event.currentTarget.getBoundingClientRect().top) / event.currentTarget.clientHeight * (el.scrollHeight - el.clientHeight), behavior: "smooth" }); }}><span style={{ top: `${scrollRatio * (1 - thumbRatio) * 100}%`, height: `${thumbRatio * 100}%` }} /></div>
        <button type="button" aria-label="Przewiń listę w dół" onClick={() => scroll.current?.scrollBy({ top: 150, behavior: "smooth" })}><img src={asset("scroll-down.svg")} alt="" /></button>
      </div>
    </div>
    {error && <p className="provider-feedback is-error" role="alert">{error}</p>}
    {!history && removed && <div className="absence-remove-feedback" role="status">Usunięto nieobecność {removed.number}.<button type="button" disabled={busy} onClick={() => void cancel(removed, false)}>Cofnij usunięcie</button></div>}
  </>;
}
