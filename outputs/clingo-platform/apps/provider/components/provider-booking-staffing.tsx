"use client";
import { useEffect, useState } from "react";
import { providerApi } from "../lib/provider-client";
import type { Job } from "../lib/provider-jobs";

type Employee = { id: string; name: string };
type Staffing = { revision: number; requiredWorkers: number; assigned: Employee[]; available: Employee[] };
export function ProviderBookingStaffing({ job, onSaved }: { job: Job; onSaved: (job: Job) => void }) {
  const [data, setData] = useState<Staffing>(), [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [accept, setAccept] = useState(false), [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(undefined); setError(""); setAccept(false);
    providerApi<Staffing>(`bookings/${job.bookingId}/staffing`, "POST", { sessionIndex: (job.sessionIndex ?? 1) - 1 }, controller.signal)
      .then(result => { setData(result); setSelected(result.assigned.map(row => row.id)); })
      .catch(error => { if (error.name !== "AbortError") setError(error.message); });
    return () => controller.abort();
  }, [job.bookingId, job.sessionIndex, job.revision, version]);
  async function save() {
    if (!data || busy) return;
    setBusy(true); setError("");
    try {
      const rows = await providerApi<Job[]>(`bookings/${job.bookingId}/staffing`, "PUT", { revision: data.revision, sessionIndex: (job.sessionIndex ?? 1) - 1, employeeIds: selected, acceptUnderstaffing: accept });
      window.dispatchEvent(new Event("provider-bookings-changed"));
      onSaved(rows.find(row => row.id === job.id) ?? rows[0]);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  const rows = Array.from(new Map([...(data?.available ?? []), ...(data?.assigned ?? [])].map(row => [row.id, row])).values());
  const shortage = !!data && selected.length < data.requiredWorkers;
  return <section aria-label="Obsada sesji">
    <h3>Obsada sesji</h3>
    {!data && !error && <p role="status">Sprawdzamy grafik i dostępność pracowników…</p>}
    {data && <>
      <p>Czas realizacji obliczono dla {data.requiredWorkers} {data.requiredWorkers === 1 ? "osoby" : "osób"}. Wybrano: {selected.length}.</p>
      {rows.map(employee => { const available = data.available.some(row => row.id === employee.id); return <label className="order-details-pick-employee" key={employee.id}>
        <input type="checkbox" checked={selected.includes(employee.id)} disabled={busy || !available && !selected.includes(employee.id)} onChange={event => { setAccept(false); setSelected(current => event.target.checked ? [...current, employee.id] : current.filter(id => id !== employee.id)); }} />
        {employee.name}{!available && <span>Niedostępny — zmień przypisanie</span>}
      </label>; })}
      {!rows.length && <p>Brak dostępnych pracowników. Sprawdź grafik, rodzaj usługi i nieobecności.</p>}
      {shortage && <label className="team-help"><input type="checkbox" checked={accept} disabled={busy} onChange={event => setAccept(event.target.checked)} /> Potwierdzam realizację w mniejszej obsadzie. Czas zamówienia pozostaje bez zmian.</label>}
      <div className="settings-live-actions"><button className="employee-save-button" type="button" disabled={busy || !selected.length || shortage && !accept} onClick={() => void save()}>{busy ? "Zapisywanie…" : "Zapisz obsadę"}</button><button className="settings-button" type="button" disabled={busy} onClick={() => setVersion(value => value + 1)}>Odśwież dostępność</button></div>
    </>}
    {error && <p className="provider-feedback is-error" role="alert">{error}<button type="button" disabled={busy} onClick={() => setVersion(value => value + 1)}>Wczytaj aktualne dane</button></p>}
  </section>;
}
