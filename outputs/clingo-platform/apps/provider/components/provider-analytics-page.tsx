"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProviderShell } from "./provider-shell";
import { useSettingsResource } from "./provider-settings-state";
import { analyzeJobs, analyticsCsv, employeeKey, employeeLabel, money, numberLabel, percentageChange, type AnalyticsMetric } from "../lib/provider-analytics";
import { jobStatuses, timeLabel, type Job } from "../lib/provider-jobs";
import { shiftDate, warsawToday } from "../lib/provider-schedule";

const metricNames = { value: "Wartość zleceń", count: "Zakończone zlecenia", hours: "Godziny zleceń" };
const metricLabel = (metric: AnalyticsMetric, value: number) => metric === "value" ? money(value) : metric === "hours" ? `${numberLabel(value)} h` : numberLabel(value);
const shortDate = (date: string) => `${date.slice(8)}.${date.slice(5, 7)}`;

function Ranking({ title, rows, onSelect }: { title: string; rows: NonNullable<ReturnType<typeof analyzeJobs>>["services"]; onSelect: (id: string) => void }) {
  return <section className="analytics-live-section"><h2>{title}</h2>{!rows.length ? <p>Brak zakończonych zleceń.</p> : <div className="analytics-table-scroll"><table><thead><tr><th scope="col">{title === "Usługi" ? "Usługa" : "Pracownik"}</th><th scope="col">Zakończone</th><th scope="col">Wartość</th><th scope="col">Godziny</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><th scope="row"><button type="button" className="analytics-text-button" onClick={() => onSelect(row.id)}>{row.name}</button></th><td>{row.count}</td><td>{money(row.value)}</td><td>{numberLabel(row.hours)} h</td></tr>)}</tbody></table></div>}</section>;
}

function AnalyticsContent() {
  const resource = useSettingsResource<Job[]>("jobs");
  const [start, setStart] = useState(() => shiftDate(warsawToday(), -29));
  const [end, setEnd] = useState(warsawToday);
  const [preset, setPreset] = useState("30");
  const [offer, setOffer] = useState("");
  const [employee, setEmployee] = useState("");
  const [metric, setMetric] = useState<AnalyticsMetric>("value");
  const [comparison, setComparison] = useState(true);
  const [status, setStatus] = useState("");
  const [bucket, setBucket] = useState<{ start: string; end: string } | null>(null);
  const [exportError, setExportError] = useState("");
  const jobs = resource.data ?? [];
  const report = useMemo(() => analyzeJobs(resource.data ?? [], { start, end, offer, employee }), [resource.data, start, end, offer, employee]);
  const offers = [...new Map(jobs.map(job => [job.offerId, job.serviceTitle])).entries()];
  const employees = [...new Map(jobs.map(job => [employeeKey(job), employeeLabel(job)])).entries()];
  const resetDetails = () => { setStatus(""); setBucket(null); setExportError(""); };
  const details = report?.current.filter(job => (!status || job.status === status) && (!bucket || (job.date >= bucket.start && job.date <= bucket.end))) ?? [];

  function download() {
    setExportError("");
    try {
      const url = URL.createObjectURL(new Blob([analyticsCsv(details)], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url; link.download = `clingo-analizy-${start}-${end}.csv`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setExportError("Nie udało się przygotować pliku. Spróbuj ponownie."); }
  }

  if (resource.loading || resource.error) return <div className="provider-state" role={resource.error ? "alert" : "status"}>{resource.loading ? "Wczytywanie analiz…" : <><p>{resource.error}</p><button className="settings-button" onClick={resource.reload}>Spróbuj ponownie</button></>}</div>;

  return <section className="analytics-live" aria-labelledby="analytics-title">
    <div className="analytics-live-heading"><h1 id="analytics-title">Analizy i podsumowania</h1><button type="button" className="settings-button" onClick={resource.reload}>Odśwież</button></div>
    <p className="analytics-scope">Ręczne zlecenia tej działalności. Wartości dotyczą zakończonych zleceń, nie otrzymanych płatności. Godziny wynikają z zapisanego czasu zleceń.</p>
    <div className="analytics-live-filters">
      <label className="settings-live-field"><span>Okres</span><select value={preset} onChange={event => { const value = event.target.value; setPreset(value); if (value !== "custom") { setStart(shiftDate(warsawToday(), 1 - Number(value))); setEnd(warsawToday()); } resetDetails(); }}><option value="7">Ostatnie 7 dni</option><option value="30">Ostatnie 30 dni</option><option value="90">Ostatnie 90 dni</option><option value="custom">Własny zakres</option></select></label>
      <label className="settings-live-field"><span>Od</span><input type="date" value={start} required onChange={event => { setStart(event.target.value); setPreset("custom"); resetDetails(); }} /></label>
      <label className="settings-live-field"><span>Do</span><input type="date" value={end} required onChange={event => { setEnd(event.target.value); setPreset("custom"); resetDetails(); }} /></label>
      <label className="settings-live-field"><span>Usługa</span><select value={offer} onChange={event => { setOffer(event.target.value); resetDetails(); }}><option value="">Wszystkie usługi</option>{offers.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
      <label className="settings-live-field"><span>Pracownik</span><select value={employee} onChange={event => { setEmployee(event.target.value); resetDetails(); }}><option value="">Wszyscy pracownicy</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    </div>
    <label className="analytics-comparison"><input type="checkbox" checked={comparison} onChange={event => setComparison(event.target.checked)} />Porównaj z poprzednim okresem{report && comparison ? ` (${report.previousStart} – ${report.previousEnd})` : ""}</label>
    {!report ? <p role="alert" className="provider-feedback is-error">Wybierz poprawny zakres od 1 do 366 dni. Data końcowa nie może poprzedzać początkowej.</p> : <>
      {!report.current.length && <p className="provider-feedback" role="status">Brak zleceń dla wybranych filtrów. <Link href="/orders">Przejdź do zleceń</Link></p>}
      <div className="analytics-live-kpis" aria-live="polite">{(["value", "count", "hours"] as const).map(key => <article key={key}><span>{metricNames[key]}</span><strong>{metricLabel(key, report.totals[key])}</strong>{comparison && <small>{percentageChange(report.totals[key], report.previousTotals[key])} względem poprzedniego okresu</small>}</article>)}<article><span>Średnia wartość zlecenia</span><strong>{money(report.totals.average)}</strong>{comparison && <small>{percentageChange(report.totals.average, report.previousTotals.average)} względem poprzedniego okresu</small>}</article></div>
      <section className="analytics-live-section"><div className="analytics-section-heading"><h2>Wyniki w czasie</h2><div className="analytics-metrics" role="group" aria-label="Miara wykresu">{(Object.keys(metricNames) as AnalyticsMetric[]).map(key => <button type="button" key={key} aria-pressed={metric === key} onClick={() => setMetric(key)}>{metricNames[key]}</button>)}</div></div>
        <div className="analytics-chart-legend"><span>Bieżący okres</span>{comparison && <span>Poprzedni okres</span>}</div>
        <div className="analytics-live-chart" aria-label={metricNames[metric]}>{report.series.map(point => {
          const maximum = Math.max(1, ...report.series.flatMap(item => [item.current[metric], ...(comparison ? [item.previous[metric]] : [])]));
          return <button type="button" className="analytics-chart-bucket" key={point.start} aria-pressed={bucket?.start === point.start} aria-label={`${point.start} do ${point.end}: ${metricLabel(metric, point.current[metric])}${comparison ? `; poprzedni okres ${point.comparisonStart} do ${point.comparisonEnd}: ${metricLabel(metric, point.previous[metric])}` : ""}`} title={`${point.start} – ${point.end}: ${metricLabel(metric, point.current[metric])}${comparison ? `; ${point.comparisonStart} – ${point.comparisonEnd}: ${metricLabel(metric, point.previous[metric])}` : ""}`} onClick={() => { setBucket(bucket?.start === point.start ? null : { start: point.start, end: point.end }); setStatus(""); }}><span className="analytics-bar-value">{metricLabel(metric, point.current[metric])}</span><span className="analytics-bar-pair"><i style={{ height: `${point.current[metric] / maximum * 100}%` }} />{comparison && <i style={{ height: `${point.previous[metric] / maximum * 100}%` }} />}</span><span>{shortDate(point.start)}</span></button>;
        })}</div>
      </section>
      <section className="analytics-live-section"><h2>Status zleceń</h2><div className="analytics-status-filters" role="group" aria-label="Filtr statusu zleceń"><button type="button" aria-pressed={!status && !bucket} onClick={() => { setStatus(""); setBucket(null); }}>Wszystkie <strong>{report.current.length}</strong></button>{(Object.keys(jobStatuses) as Job["status"][]).map(key => <button type="button" key={key} className={`is-${key}`} aria-pressed={status === key} onClick={() => { setStatus(status === key ? "" : key); setBucket(null); }}>{jobStatuses[key]} <strong>{report.counts[key]}</strong></button>)}</div><p>Klienci z zakończonym zleceniem: <strong>{report.activeClients}</strong>. W tym z co najmniej dwoma zakończonymi zleceniami do końca okresu, dla wybranych filtrów: <strong>{report.returning}</strong>.</p></section>
      <Ranking title="Usługi" rows={report.services} onSelect={id => { setOffer(id); resetDetails(); }} />
      <Ranking title="Pracownicy" rows={report.employees} onSelect={id => { setEmployee(id); resetDetails(); }} />
      <section className="analytics-live-section" id="analytics-details"><div className="analytics-section-heading"><h2>Zlecenia w zestawieniu ({details.length})</h2><div className="analytics-detail-actions">{(status || bucket) && <button type="button" className="settings-button" onClick={resetDetails}>Wyczyść wybór</button>}<button type="button" className="settings-button" disabled={!details.length} onClick={download}>Pobierz CSV</button></div></div>{bucket && <p role="status">Wybrany przedział: {bucket.start} – {bucket.end}</p>}{exportError && <p role="alert">{exportError}</p>}
        {!details.length ? <p>Brak zleceń w zestawieniu.</p> : <div className="analytics-table-scroll"><table><thead><tr><th scope="col">Termin</th><th scope="col">Usługa</th><th scope="col">Pracownik</th><th scope="col">Status</th><th scope="col">Wartość</th></tr></thead><tbody>{details.map(job => <tr key={job.id}><td><Link href={`/orders/${job.id}/edit`} aria-label={`Otwórz zlecenie: ${job.serviceTitle}, ${job.date}, ${timeLabel(job.startMinute)}`}>{job.date}<br />{timeLabel(job.startMinute)}</Link></td><td>{job.serviceTitle}</td><td>{employeeLabel(job)}</td><td>{jobStatuses[job.status]}</td><td>{money(job.priceMinor)}</td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </section>;
}

export function ProviderAnalyticsPage() {
  return <ProviderShell active="Analizy i podsumowania" figmaNode="6771:12214" live><AnalyticsContent /></ProviderShell>;
}
