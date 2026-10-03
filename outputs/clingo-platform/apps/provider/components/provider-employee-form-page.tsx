"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ProviderShell } from "./provider-shell";
import { ProviderModal } from "./provider-modal";
import { ApiError, dayNames, dayMinutes, hoursLabel, initials, newEmployee, providerApi, services, weekMinutes, type Employee, type EmployeeDraft } from "../lib/provider-client";

function EmployeeForm({ mode }: { mode: "add" | "edit" }) {
  const editing = mode === "edit";
  const [draft, setDraft] = useState<EmployeeDraft>(newEmployee);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pending = useRef(false);
  useEffect(() => {
    if (!editing) return;
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id || !/^[a-f0-9-]{36}$/.test(id)) { setLoadError("Wybierz pracownika z listy, aby go edytować."); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setLoadError("");
    providerApi<Employee>(`employees/${id}`, "GET", undefined, controller.signal).then(person => {
      setEmployee(person); setDraft({ name: person.name, email: person.email, phone: person.phone, showInCalendar: person.showInCalendar, services: person.services, schedule: person.schedule });
      setDirty(false); setConflict(false); setError("");
    }).catch(error => { if (!controller.signal.aborted) setLoadError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [editing, attempt]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty && !pending.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const update = (change: Partial<EmployeeDraft>) => { setDraft(current => ({ ...current, ...change })); setDirty(true); };
  async function save(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    if (draft.schedule.some(day => day.enabled && day.end <= day.start)) { setError("Koniec pracy musi być późniejszy niż początek."); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      const saved = await providerApi<Employee>(editing ? `employees/${employee!.id}` : "employees", editing ? "PUT" : "POST", { ...draft, ...(editing ? { revision: employee!.revision } : {}) });
      setDirty(false); window.location.assign(`/employees?employee=${saved.id}&saved=1`);
    } catch (error) { setError((error as Error).message); setConflict(error instanceof ApiError && error.status === 409); pending.current = false; setBusy(false); }
  }
  async function remove() {
    if (!employee || pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try { await providerApi(`employees/${employee.id}`, "DELETE", { revision: employee.revision }); setDirty(false); window.location.assign("/employees?deleted=1"); }
    catch (error) { setError((error as Error).message); setConflict(error instanceof ApiError && error.status === 409); setDeleting(false); pending.current = false; setBusy(false); }
  }
  if (loading) return <div className="provider-state" role="status">Wczytywanie pracownika…</div>;
  if (loadError) return <div className="provider-state" role="alert"><p>{loadError}</p><button onClick={() => setAttempt(value => value + 1)}>Spróbuj ponownie</button><Link href="/employees">Wróć do listy</Link></div>;
  return <form className="employee-form-content" onSubmit={save}>
    <div className="employee-form-toolbar"><Link href="/employees" onClick={event => { if (dirty && !window.confirm("Opuścić formularz bez zapisywania zmian?")) event.preventDefault(); }}>← Wróć do pracowników</Link><div className="employee-form-actions">{editing && <button type="button" className="employee-delete-button" disabled={busy} onClick={() => setDeleting(true)}>Usuń pracownika</button>}<button className="employee-save-button" disabled={busy || conflict}>{busy ? "Zapisywanie…" : "Zapisz"}</button></div></div>
    {error && <div className="provider-feedback is-error" role="alert">{error}{conflict && <button type="button" onClick={() => { if (window.confirm("Wczytać aktualne dane i odrzucić niezapisane zmiany?")) setAttempt(value => value + 1); }}>Wczytaj aktualne dane</button>}</div>}
    <fieldset className="employee-form-columns" disabled={busy}>
      <section className="employee-form-panel employee-details-form" aria-label="Dane pracownika">
        <span className="employee-main-avatar employee-initials">{draft.name ? initials(draft.name) : "+"}</span><h1>{editing ? "Edytuj pracownika" : "Nowy pracownik"}</h1>
        <label className="team-field">Imię i nazwisko<input value={draft.name} onChange={event => update({ name: event.target.value })} required maxLength={180} autoComplete="name" /></label>
        <label className="team-field">Numer telefonu<input value={draft.phone} onChange={event => update({ phone: event.target.value })} type="tel" maxLength={40} autoComplete="tel" placeholder="+48 …" /></label>
        <label className="team-field">Adres e-mail<input value={draft.email} onChange={event => update({ email: event.target.value })} type="email" maxLength={320} autoComplete="email" /></label>
        <label className="team-checkbox"><input type="checkbox" checked={draft.showInCalendar} onChange={event => update({ showInCalendar: event.target.checked })} />Pokazuj pracownika w grafiku pracy</label>
        <p className="team-help">Dodanie pracownika zapisuje jego dane i grafik. Zaproszenia oraz dostęp do panelu pracownika nie są jeszcze dostępne.</p>
      </section>
      <section className="employee-form-panel employee-services-form" aria-label="Przypisz usługi"><div className="employee-form-heading"><h2>Przypisz usługi</h2><p>Wybierz usługi realizowane przez pracownika.</p></div><label className="team-checkbox"><input type="checkbox" checked={draft.services.length === services.length} onChange={event => update({ services: event.target.checked ? services.map(service => service.id) : [] })} />Wszystkie rodzaje usług</label><h3>Sprzątanie obiektów</h3>{services.map(service => <label className="team-checkbox" key={service.id}><input type="checkbox" checked={draft.services.includes(service.id)} onChange={event => update({ services: event.target.checked ? [...draft.services, service.id] : draft.services.filter(id => id !== service.id) })} />{service.label}</label>)}</section>
      <section className="employee-form-panel employee-schedule-form" aria-label="Ustaw grafik pracownika"><div className="employee-form-heading"><h2>Ustaw grafik pracownika</h2><p>Stałe dni i godziny pracy. Grafik nie zmienia jeszcze dostępności rezerwacji klientów.</p></div><div className="employee-configure-workdays">{draft.schedule.map(day => <div className={`team-workday${day.enabled ? "" : " is-disabled"}`} key={day.day}><label><input type="checkbox" checked={day.enabled} onChange={event => update({ schedule: draft.schedule.map(item => item.day === day.day ? { ...item, enabled: event.target.checked } : item) })} />{dayNames[day.day]}</label><div><input type="time" step={60} aria-label={`Początek pracy — ${dayNames[day.day]}`} value={day.start} disabled={!day.enabled || busy} required onChange={event => update({ schedule: draft.schedule.map(item => item.day === day.day ? { ...item, start: event.target.value } : item) })} /><span>–</span><input type="time" step={60} aria-label={`Koniec pracy — ${dayNames[day.day]}`} value={day.end} disabled={!day.enabled || busy} required onChange={event => update({ schedule: draft.schedule.map(item => item.day === day.day ? { ...item, end: event.target.value } : item) })} /></div><span>{hoursLabel(dayMinutes(day))}</span></div>)}<p className="weekly-hours">Łącznie w tygodniu: <strong>{hoursLabel(weekMinutes(draft))}</strong></p></div></section>
    </fieldset>
    {deleting && <ProviderModal titleId="delete-employee-title" onClose={() => { if (!busy) setDeleting(false); }}><h2 id="delete-employee-title">Usuń pracownika</h2><p>Usunąć dane i stały grafik pracownika {employee?.name}? Tej operacji nie można cofnąć.</p><div className="employee-form-actions"><button type="button" disabled={busy} onClick={() => setDeleting(false)}>Anuluj</button><button type="button" disabled={busy} className="employee-delete-button" onClick={remove}>{busy ? "Usuwanie…" : "Usuń pracownika"}</button></div></ProviderModal>}
  </form>;
}
export function ProviderEmployeeFormPage({ mode = "add" }: { mode?: "add" | "edit" }) { return <ProviderShell active="Pracownicy" figmaNode={mode === "edit" ? "5879:10140" : "4049:5309"}><EmployeeForm mode={mode} /></ProviderShell>; }
