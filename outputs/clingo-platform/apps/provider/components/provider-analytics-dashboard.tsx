"use client";

import "../app/analytics-dashboard.css";
import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { ProviderShell } from "./provider-shell";
import { ProviderModal } from "./provider-modal";
import { ProviderAnalyticsChart } from "./provider-analytics-chart";
import { useSettingsResource } from "./provider-settings-state";
import { initials, type Employee } from "../lib/provider-client";
import { analyticsCsv, employeeKey, employeeLabel, money, numberLabel, percentageChange, rangeDays, type AnalyticsMetric } from "../lib/provider-analytics";
import { dashboardAnalytics, isRescheduled, rate, type AnalyticsAbsence } from "../lib/provider-analytics-dashboard";
import { jobStatuses, timeLabel, type Job } from "../lib/provider-jobs";
import { parseDay, shiftDate, warsawToday } from "../lib/provider-schedule";

const asset = (name: string) => `/figma-assets/analytics/dashboard/${name}`;
const metricNames = { value: "Wartość zamówień", count: "Zamówienia", hours: "Godziny pracy" };
const dayNames = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const percent = (value: number | null) => value === null ? "—" : `${numberLabel(value)}%`;
const difference = (value: number, previous: number) => `${value - previous > 0 ? "+" : ""}${numberLabel(value - previous)} p.p.`;
function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="analytics-filter"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{children}</select><img src={asset("dropdown.svg")} alt="" /></label>;
}
function Change({ value, previous, comparison, points = false, inverse = false }: { value: number; previous: number; comparison: boolean; points?: boolean; inverse?: boolean }) {
  if (!comparison) return <small className="analytics-change is-neutral">Bez porównania</small>;
  if (!points && previous === 0) return <small className="analytics-change is-neutral">{value ? "Brak wartości bazowej" : "Bez zmian"}</small>;
  const good = inverse ? value <= previous : value >= previous;
  return <small className={`analytics-change ${good ? "is-positive" : "is-negative"}`}>{points ? difference(value, previous) : percentageChange(value, previous)} <span>vs poprzedni okres</span></small>;
}

function AnalyticsContent() {
  const resource = useSettingsResource<Job[]>("jobs");
  const team = useSettingsResource<Employee[]>("employees");
  const absence = useSettingsResource<AnalyticsAbsence[]>("absences");
  const [start, setStart] = useState(() => shiftDate(warsawToday(), -29)), [end, setEnd] = useState(warsawToday);
  const [preset, setPreset] = useState("30"), [offer, setOffer] = useState(""), [employee, setEmployee] = useState("");
  const [metric, setMetric] = useState<AnalyticsMetric>("value"), [comparison, setComparison] = useState(true);
  const [detail, setDetail] = useState<{ status?: string; start?: string; end?: string; day?: number; hour?: number } | null>(null);
  const [exportError, setExportError] = useState("");
  const scheduleRef = useRef<HTMLElement>(null);
  const jobs = resource.data ?? [];
  const report = useMemo(() => dashboardAnalytics(resource.data ?? [], { start, end, offer, employee }, team.data ?? [], absence.data ?? []), [resource.data, start, end, offer, employee, team.data, absence.data]);
  const offers = [...new Map(jobs.map(job => [job.offerId, job.serviceTitle])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pl"));
  const employees = [...new Map([...(team.data ?? []).map(row => [row.id, row.name] as const), ...jobs.map(job => [employeeKey(job), employeeLabel(job)] as const)]).entries()].sort((a, b) => a[1].localeCompare(b[1], "pl"));
  const details = report?.current.filter(job => {
    const statusMatch = !detail?.status || (detail.status === "rescheduled" ? job.status === "scheduled" && isRescheduled(job) : detail.status === "scheduled" ? job.status === "scheduled" && !isRescheduled(job) : job.status === detail.status);
    const dayMatch = detail?.day === undefined || (parseDay(job.date).getUTCDay() + 6) % 7 === detail.day;
    const timeMatch = detail?.hour === undefined || job.startMinute < 600 + detail.hour * 120 && job.startMinute + job.durationMinutes > 480 + detail.hour * 120;
    return statusMatch && dayMatch && timeMatch && (!detail?.start || job.date >= detail.start) && (!detail?.end || job.date <= detail.end);
  }) ?? [];
  function openDetails(value: NonNullable<typeof detail> = {}) { setExportError(""); setDetail(value); }
  function reload() { resource.reload(); team.reload(); absence.reload(); }
  function download() {
    setExportError("");
    try {
      const url = URL.createObjectURL(new Blob([analyticsCsv(details)], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = `clingo-analizy-${start}-${end}.csv`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setExportError("Nie udało się przygotować pliku. Spróbuj ponownie."); }
  }
  const loading = resource.loading || team.loading || absence.loading;
  const error = resource.error || team.error || absence.error;
  if (loading || error) return <div className="provider-state" role={error ? "alert" : "status"}>{loading ? "Wczytywanie analiz…" : <><p>{error}</p><button type="button" className="settings-button" onClick={reload}>Spróbuj ponownie</button></>}</div>;
  const statusItems = report ? [
    { key: "completed", label: "Wykonane", count: report.status.completed, color: "#25a65b", icon: "completed.svg" },
    { key: "cancelled", label: "Odwołane", count: report.status.cancelled, color: "#f4a239", icon: "cancelled.svg" },
    { key: "rescheduled", label: "Przełożone", count: report.status.rescheduled, color: "#89bce9", icon: "rescheduled.svg" },
    ...(report.status.scheduled ? [{ key: "scheduled", label: "Zaplanowane", count: report.status.scheduled, color: "#ccd7e1", icon: "" }] : [])
  ] : [];
  let offset = 0;
  return <section className="analytics-content analytics-figma" aria-labelledby="analytics-title"><div className="analytics-dashboard">
    <div className="analytics-page-header"><div className="analytics-title"><h1 id="analytics-title">Analizy i podsumowania</h1><p>Sprawdź wyniki swojej działalności i zobacz, co możesz poprawić.</p></div>
      <div className="analytics-filters">
        <Filter label="Okres" value={preset} onChange={value => { setPreset(value); if (value !== "custom") { setStart(shiftDate(warsawToday(), 1 - Number(value))); setEnd(warsawToday()); } }}><option value="7">Ostatnie 7 dni</option><option value="30">Ostatnie 30 dni</option><option value="90">Ostatnie 90 dni</option><option value="custom">Własny zakres</option></Filter>
        <Filter label="Porównanie okresów" value={comparison ? "previous" : "none"} onChange={value => setComparison(value === "previous")}><option value="previous">vs poprzednie {rangeDays(start, end) || 30} dni</option><option value="none">Bez porównania</option></Filter>
        <Filter label="Usługa" value={offer} onChange={setOffer}><option value="">Wszystkie usługi</option>{offers.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</Filter>
        <Filter label="Pracownik" value={employee} onChange={setEmployee}><option value="">Wszyscy pracownicy</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</Filter>
      </div>
    </div>
    {preset === "custom" && <div className="analytics-custom-range"><label>Od<input type="date" aria-label="Od" required value={start} onChange={event => setStart(event.target.value)} /></label><label>Do<input type="date" aria-label="Do" required value={end} onChange={event => setEnd(event.target.value)} /></label></div>}
    {!report ? <p role="alert" className="provider-feedback is-error">Wybierz poprawny zakres od 1 do 366 dni. Data końcowa nie może poprzedzać początkowej.</p> : <>
      {!report.current.length && <p className="analytics-empty-notice" role="status">Brak zamówień dla wybranych filtrów. <button type="button" onClick={() => { setOffer(""); setEmployee(""); }}>Wyczyść filtry</button></p>}
      <div className="analytics-kpis analytics-live-kpis" aria-live="polite">
        <article className="analytics-kpi"><span>Wartość wykonanych zamówień</span><strong>{money(report.totals.value)}</strong><Change value={report.totals.value} previous={report.previousTotals.value} comparison={comparison} /></article>
        <article className="analytics-kpi"><span>Wykonane zamówienia</span><strong>{report.totals.count}</strong><Change value={report.totals.count} previous={report.previousTotals.count} comparison={comparison} /></article>
        <article className="analytics-kpi"><span>Średnia wartość zamówienia</span><strong>{money(report.totals.average)}</strong><Change value={report.totals.average} previous={report.previousTotals.average} comparison={comparison} /></article>
        <article className="analytics-kpi"><span>Wykorzystanie grafiku</span><strong title="Zajęte godziny przypisanych pracowników podzielone przez ich dostępny czas pracy, po odjęciu nieobecności.">{percent(report.usage.rate)}</strong>{report.usage.rate !== null && report.previousUsage.rate !== null ? <Change value={report.usage.rate} previous={report.previousUsage.rate} comparison={comparison} points /> : <small className="is-neutral">Brak godzin do porównania</small>}</article>
        <article className="analytics-kpi"><span>Klienci powracający</span><strong>{percent(report.returningRate)}</strong><Change value={report.returningRate} previous={report.previousReturningRate} comparison={comparison} points /></article>
        <article className="analytics-kpi"><span>Anulowane zamówienia</span><strong>{percent(report.cancellationRate)}</strong><Change value={report.cancellationRate} previous={report.previousCancellationRate} comparison={comparison} points inverse /></article>
      </div>
      <div className="analytics-wide-row">
        <section className="analytics-card results-card"><div className="results-header"><h2>Wyniki w czasie</h2><div className="metric-switcher" role="group" aria-label="Miara wykresu">{(Object.keys(metricNames) as AnalyticsMetric[]).map(key => <button type="button" className={metric === key ? "is-active" : ""} key={key} aria-pressed={metric === key} onClick={() => setMetric(key)}>{metricNames[key]}</button>)}</div></div><ProviderAnalyticsChart series={report.series} metric={metric} comparison={comparison} onSelect={point => openDetails({ start: point.start, end: point.end })} /></section>
        <section className="analytics-card insights-card"><h2>Najważniejsze wnioski</h2>
          <p>{comparison ? `Wartość wykonanych zamówień: ${percentageChange(report.totals.value, report.previousTotals.value).toLocaleLowerCase("pl-PL")} względem poprzedniego okresu.` : `Wartość wykonanych zamówień wyniosła ${money(report.totals.value)}.`} <button type="button" onClick={() => openDetails({ status: "completed" })}>Zobacz szczegóły →</button></p>
          <p>{report.free ? `Najwięcej wolnych godzin grafiku: ${dayNames[report.free.day]}, ${8 + report.free.hour * 2}:00–${10 + report.free.hour * 2}:00.` : "Brak wolnych godzin w zapisanym grafiku dla wybranego okresu."} <button type="button" onClick={() => scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>Zobacz szczegóły →</button></p>
          <p>{comparison ? `Odsetek anulowanych zamówień zmienił się o ${difference(report.cancellationRate, report.previousCancellationRate)}.` : `Anulowano ${report.counts.cancelled} zamówień w wybranym okresie.`} <button type="button" onClick={() => openDetails({ status: "cancelled" })}>Zobacz szczegóły →</button></p>
        </section>
      </div>
      <div className="analytics-wide-row analytics-schedule-row">
        <section className="analytics-card heatmap-card" ref={scheduleRef}><div className="heatmap-header"><div><h2>Wykorzystanie grafiku</h2><p>Udział zarezerwowanych godzin w dostępnych godzinach pracy.</p></div><span>Średnie wykorzystanie: {percent(report.usage.rate)}</span></div>
          <div className="analytics-heatmap-scroller"><div className="heatmap"><div className="heatmap-time"><span />{Array.from({ length: 7 }, (_, index) => <span key={index}>{8 + index * 2}–{10 + index * 2}</span>)}</div>{report.usage.cells.map((row, day) => <div className="heatmap-row" key={day}><span>{dayNames[day]}</span>{row.map((cell, hour) => { const value = rate(cell.booked, cell.available); return <button type="button" key={hour} className={`level-${value > 75 ? 3 : value > 55 ? 2 : value > 30 ? 1 : 0}`} aria-label={`${dayNames[day]} ${8 + hour * 2}–${10 + hour * 2}: ${cell.available ? percent(value) : "brak grafiku"}`} title={`${numberLabel(cell.booked / 60)} h zarezerwowanych / ${numberLabel(cell.available / 60)} h dostępnych`} onClick={() => openDetails({ day, hour })} />; })}</div>)}<div className="heatmap-legend">mniejsze{[0, 1, 2, 3].map(value => <i className={`level-${value}`} key={value} />)}większe</div></div></div>
          {!report.usage.available && <p className="analytics-inline-empty">Uzupełnij <Link href="/work-schedules">grafiki pracowników</Link>, aby obliczyć wykorzystanie.</p>}
        </section>
        <section className="analytics-card order-status-card"><h2>Status zamówień</h2><div className="status-visual"><div className="status-donut"><svg viewBox="0 0 138 110" role="img" aria-label={`${report.current.length} zamówień w wybranym okresie`}><circle cx="69" cy="55" r="39" fill="none" stroke="#edf3f8" strokeWidth="16" />{statusItems.filter(item => item.count).map(item => { const fraction = item.count / report.current.length; const before = offset; offset += fraction; return <circle key={item.key} cx="69" cy="55" r="39" pathLength="100" fill="none" stroke={item.color} strokeWidth="16" strokeDasharray={`${fraction * 100} ${100 - fraction * 100}`} strokeDashoffset={-before * 100} transform="rotate(-90 69 55)" />; })}<text x="69" y="52" textAnchor="middle" fill="#2e3b4c" fontSize="20">{report.current.length}</text><text x="69" y="71" textAnchor="middle" fill="#7c8691" fontSize="12">zamówień</text></svg></div><div className="status-legend">{statusItems.map(item => <button type="button" key={item.key} onClick={() => openDetails({ status: item.key })} aria-label={`${item.label} ${item.count}`}>{item.icon ? <img src={asset(item.icon)} alt="" /> : <i style={{ background: item.color }} />}<span>{item.label}</span><strong>{item.count}</strong></button>)}</div></div><p className="cancellation-note">Szacowana utracona wartość anulowań: {money(report.lostValue)}</p></section>
      </div>
      <section className="analytics-card top-services-card"><h2>Najskuteczniejsze usługi</h2><div className="analytics-services-content"><div className="analytics-table-scroll"><table className="analytics-services-table"><thead><tr>{["Usługa", "Zamówienia", "Wartość", "Godziny", "Wartość / godz.", "Zmiana"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{report.services.map(row => <tr key={row.id}><th scope="row"><button type="button" className="analytics-text-button" onClick={() => setOffer(row.id)}>{row.name}</button></th><td>{row.count}</td><td>{money(row.value)}</td><td>{numberLabel(row.hours)} h</td><td>{money(row.perHour)}/h</td><td className={row.value >= row.previousValue ? "is-positive" : "is-negative"}>{comparison ? percentageChange(row.value, row.previousValue) : "—"}</td></tr>)}</tbody></table>{!report.services.length && <p className="analytics-inline-empty">Brak wykonanych zamówień.</p>}</div><div className="popular-addons"><h3>Najpopularniejsze usługi dodatkowe</h3>{report.addOns.slice(0, 3).map(row => <div key={row.id}><span>{row.name}</span><strong>{row.count} zamówień</strong></div>)}{!report.addOns.length && <p className="analytics-inline-empty">Brak zarejestrowanych usług dodatkowych w wykonanych zamówieniach.</p>}</div></div></section>
      <div className="analytics-bottom-row"><section className="analytics-card clients-card"><div className="clients-header"><div><h2>Klienci</h2><p>Aktywność i powroty w wybranym okresie</p></div><span>{report.activeClients} aktywnych</span></div><div className="client-kpis"><div><span>Nowi klienci</span><strong>{report.newClients}</strong><small>{numberLabel(rate(report.newClients, report.activeClients))}% aktywnych</small></div><div><span>Powracający</span><strong>{report.returning}</strong><small>{percent(report.returningRate)} aktywnych</small></div><div><span>Ponowna rezerwacja</span><strong>{report.rebooked}</strong><small className="is-blue">{numberLabel(rate(report.rebooked, report.activeClients))}% aktywnych</small></div></div><div className="client-structure"><strong>Struktura aktywnych klientów</strong><div className="client-bar"><i style={{ width: `${report.activeClients ? 100 - report.returningRate : 0}%` }} /><b style={{ width: `${report.returningRate}%` }} /></div><div className="client-legend"><span><img src={asset("client-new.svg")} alt="" />Nowi {numberLabel(rate(report.newClients, report.activeClients))}%</span><span><img src={asset("client-returning.svg")} alt="" />Powracający {percent(report.returningRate)}</span></div><p><b>Wniosek:</b> {report.returning} z {report.activeClients} aktywnych klientów wróciło w tym okresie.</p></div></section>
        <section className="analytics-card employee-results-card"><div className="employee-results-header"><div><h2>Wyniki pracowników</h2><p>Porównanie efektywności zespołu w wybranym okresie</p></div><span>{report.staff.length} pracowników</span></div><div className="employee-ranking analytics-employee-scroll"><div className="employee-rank-row rank-head">{["Pracownik", "Wartość zamówień", "Wykorzystanie", "Zamówienia", "Godziny", "Ocena"].map(value => <span key={value}>{value}</span>)}</div>{report.staff.map((row, index) => <div className={`employee-rank-row rank-entry${index ? " is-second" : ""}`} key={row.id}><div className="rank-person"><i>{initials(row.name)}</i><span><button type="button" onClick={() => setEmployee(row.id)}>{row.name}</button><small>{row.value ? index ? `${index + 1}. wynik w zespole` : "Najlepszy wynik w zespole" : "Brak wykonanych zamówień"}</small></span></div><div><strong>{money(row.value)}</strong><small className={row.value >= row.previousValue ? "positive" : "is-negative"}>{comparison ? percentageChange(row.value, row.previousValue) : "Bez porównania"}</small></div><div><strong>{percent(row.utilization)}</strong><div className="utilization"><i style={{ width: `${row.utilization ?? 0}%` }} /></div></div><div><strong>{row.count}</strong><small>wykonane</small></div><div><strong>{numberLabel(row.hours)} h</strong><small>pracy</small></div><div title="Opinie w systemie są przypisane do firmy, nie do konkretnego pracownika."><strong>—</strong><small>Brak opinii</small></div></div>)}{!report.staff.length && <p className="analytics-inline-empty">Brak pracowników i przypisanych zamówień.</p>}</div></section>
      </div>
      <div className="analytics-report-footer"><span>Wartości dotyczą wykonanych zamówień, nie potwierdzonych płatności. Godziny wynikają z zapisanych czasów zamówień.</span><div><button type="button" onClick={reload}>Odśwież</button><button type="button" onClick={() => openDetails()}>Zamówienia w zestawieniu ({report.current.length})</button></div></div>
    </>}
  </div>
  {detail && <ProviderModal className="analytics-details-modal" titleId="analytics-details-title" onClose={() => setDetail(null)}><div className="analytics-details-heading"><h2 id="analytics-details-title">Zamówienia w zestawieniu ({details.length})</h2><button type="button" className="settings-button" disabled={!details.length} onClick={download}>Pobierz CSV</button></div>{exportError && <p role="alert">{exportError}</p>}<div className="analytics-table-scroll"><table><thead><tr>{["Termin", "Usługa", "Pracownik", "Status", "Wartość"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{details.map(job => <tr key={job.id}><td><Link href={`/orders/${job.id}/edit`}>{job.date}<br />{timeLabel(job.startMinute)}</Link></td><td>{job.serviceTitle}</td><td>{employeeLabel(job)}</td><td>{jobStatuses[job.status]}</td><td>{money(job.priceMinor)}</td></tr>)}</tbody></table></div>{!details.length && <p>Brak zamówień w zestawieniu.</p>}</ProviderModal>}
  </section>;
}
export function ProviderAnalyticsDashboard() { return <ProviderShell active="Analizy i podsumowania" figmaNode="6771:12231" live><AnalyticsContent /></ProviderShell>; }

