"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ProviderShell } from "./provider-shell";
import { ProviderModal } from "./provider-modal";
import { ProviderToggle } from "./provider-toggle";
import { SettingsField } from "./provider-settings-fields";
import { ApiError, dayNames, dayMinutes, hoursLabel, initials, newEmployee, providerApi, services, weekMinutes, type Employee, type EmployeeDraft } from "../lib/provider-client";

function EmployeeForm({ mode }: { mode: "add" | "edit" }) {
  const editing = mode === "edit";
  const [draft, setDraft] = useState<EmployeeDraft>(() => {
    const initial = newEmployee();
    return editing ? initial : { ...initial, schedule: initial.schedule.map(day => ({ ...day, enabled: day.day !== 0, end: day.day === 0 ? "16:00" : "20:00" })) };
  });
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
  return <form className="employee-form-content employee-form-figma" onSubmit={save}>
    <div className="employee-form-toolbar"><Link href="/employees" onClick={event => { if (dirty && !window.confirm("Opuścić formularz bez zapisywania zmian?")) event.preventDefault(); }} className="employee-back-button"><img src="/figma-assets/employees/add-design/back.svg" alt="" />Powrót</Link><div className="employee-form-actions">{editing && <button type="button" className="employee-delete-button" disabled={busy} onClick={() => setDeleting(true)}>Usuń pracownika</button>}<button className="employee-save-button" disabled={busy || conflict}>{busy ? "Zapisywanie…" : "Zapisz"}</button></div></div>
    {error && <div className="provider-feedback is-error" role="alert">{error}{conflict && <button type="button" onClick={() => { if (window.confirm("Wczytać aktualne dane i odrzucić niezapisane zmiany?")) setAttempt(value => value + 1); }}>Wczytaj aktualne dane</button>}</div>}
    <h1 className="sr-only">{editing ? "Edytuj pracownika" : "Dodaj pracownika"}</h1>
    <fieldset className="employee-form-columns" disabled={busy}>
      <section className="employee-form-panel employee-details-form" aria-label="Dane pracownika" data-figma-node="4049:5331">
        <div className="employee-avatar-row"><div className="employee-avatar-placeholder">{editing && draft.name ? <span className="employee-avatar-initials">{initials(draft.name)}</span> : <img src="/figma-assets/employees/add-design/avatar.svg" alt="" />}<button type="button" disabled aria-label="Dodaj zdjęcie pracownika — funkcja niedostępna" title="Zdjęcia pracowników nie są jeszcze obsługiwane."><img src="/figma-assets/employees/add-design/avatar-plus.svg" alt="" /></button></div></div>
        <SettingsField className="employee-form-field" label="Imię i nazwisko" value={draft.name} onChange={event => update({ name: event.target.value })} required maxLength={180} autoComplete="name" />
        <SettingsField className="employee-form-field" label="Numer telefonu" value={draft.phone.replace(/^\+48\s*/, "")} onChange={event => { const value = event.target.value; update({ phone: !value || value.startsWith("+") ? value : `+48 ${value}` }); }} type="tel" maxLength={36} autoComplete="tel-national" placeholder="Wpisz numer..." prefix={(!draft.phone.startsWith("+") || draft.phone.startsWith("+48")) ? <span className="employee-phone-prefix" title="Polska, numer kierunkowy +48"><img src="/figma-assets/employees/add-design/poland.png" width={16} height={16} alt="Polska" /><span>+48</span><img className="employee-select-arrow" src="/figma-assets/employees/add-design/select.svg" alt="" /></span> : undefined} />
        <SettingsField className="employee-form-field" label="Adres e-mail" value={draft.email} onChange={event => update({ email: event.target.value })} type="email" maxLength={320} autoComplete="email" placeholder="Wpisz adres..." prefix={<img className="employee-mail-icon" src="/figma-assets/employees/add-design/mail.svg" alt="" />} />
        <div className="employee-preference employee-invitation-preference"><div className="employee-preference-control" title="Zaproszenia do panelu pracownika nie są jeszcze dostępne."><ProviderToggle label="Utwórz konto i prześlij zaproszenie — funkcja niedostępna" checked={false} /></div><div><h2>Utwórz konto i prześlij zaproszenie</h2><p>Zaproszenia do konta pracownika nie są jeszcze dostępne.</p></div></div>
        <div className="employee-form-field settings-field-row employee-permissions"><label className="settings-field"><span className="settings-field-label">Poziom uprawnień</span><select aria-label="Poziom uprawnień" disabled defaultValue="employee" title="Dostęp do panelu pracownika nie jest jeszcze dostępny."><option value="employee">Pracownik</option></select><img className="employee-select-arrow" src="/figma-assets/employees/add-design/select.svg" alt="" /></label></div>
        <label className="employee-preference employee-calendar-preference"><span className="employee-preference-control"><input type="checkbox" aria-label="Pokazuj pracownika w kalendarzu" checked={draft.showInCalendar} onChange={event => update({ showInCalendar: event.target.checked })} /><span className="employee-calendar-mark" aria-hidden="true"><img src={`/figma-assets/employees/add-design/check-${draft.showInCalendar ? "filled" : "empty"}.svg`} alt="" /></span></span><span className="employee-preference-copy"><strong>Pokazuj pracownika w kalendarzu</strong><span>Pracownik będzie widoczny w grafiku pracy.</span></span></label>
      </section>
      <section className="employee-form-panel employee-services-form" aria-label="Przypisz usługi" data-figma-node="4049:5350">
        <div className="employee-form-heading"><h2>Przypisz usługi</h2><p>Wybierz usługi, które będą realizowane przez pracownika.</p></div>
        <div className="employee-service-options">
          <button type="button" role="checkbox" aria-checked={draft.services.length === services.length ? true : draft.services.length ? "mixed" : false} className={`employee-service-option${draft.services.length === services.length ? " is-checked" : draft.services.length ? " is-partial" : ""}`} onClick={() => update({ services: draft.services.length === services.length ? [] : services.map(service => service.id) })}><span>Wszystkie rodzaje usług</span><i aria-hidden="true" /></button>
          <div className="employee-service-group"><div className="employee-service-group-heading"><img src="/figma-assets/employees/add-design/broom.png" width={26} height={26} alt="" /><h3>Sprzątanie obiektów</h3></div>{services.map(service => <button type="button" role="checkbox" aria-checked={draft.services.includes(service.id)} className={`employee-service-option is-nested${draft.services.includes(service.id) ? " is-checked" : ""}`} key={service.id} onClick={() => update({ services: draft.services.includes(service.id) ? draft.services.filter(id => id !== service.id) : [...draft.services, service.id] })}><span>{service.label}</span><i aria-hidden="true" /></button>)}</div>
        </div>
      </section>
      <section className="employee-form-panel employee-schedule-form" aria-label="Ustaw grafik pracownika" data-figma-node="4066:5769">
        <div className="employee-form-heading"><h2>Ustaw grafik pracownika</h2><p>Stałe dni i godziny pracy. Grafik nie zmienia jeszcze dostępności rezerwacji klientów.</p></div>
        <div className="employee-configure-workdays">{draft.schedule.map(day => <div className={`employee-workday${day.enabled ? "" : " is-disabled"}`} key={day.day}><div className="employee-workday-name"><ProviderToggle label={`Dzień pracy — ${dayNames[day.day]}`} checked={day.enabled} onChange={enabled => update({ schedule: draft.schedule.map(item => item.day === day.day ? { ...item, enabled } : item) })} /><span>{dayNames[day.day]}</span></div><div className="employee-work-times"><label className="employee-time-field" onClick={event => { if (event.target instanceof HTMLImageElement) { const input = event.currentTarget.querySelector("input"); if (input && !input.disabled) input.showPicker?.(); } }}><input type="time" step={60} aria-label={`Początek pracy — ${dayNames[day.day]}`} value={day.start} disabled={!day.enabled || busy} required onChange={event => update({ schedule: draft.schedule.map(item => item.day === day.day ? { ...item, start: event.target.value } : item) })} /><img src={`/figma-assets/employees/add-design/time-chevron${day.enabled ? "" : "-disabled"}.svg`} alt="" /></label><span className="employee-time-separator" aria-hidden="true" /><label className="employee-time-field" onClick={event => { if (event.target instanceof HTMLImageElement) { const input = event.currentTarget.querySelector("input"); if (input && !input.disabled) input.showPicker?.(); } }}><input type="time" step={60} aria-label={`Koniec pracy — ${dayNames[day.day]}`} value={day.end} disabled={!day.enabled || busy} required onChange={event => update({ schedule: draft.schedule.map(item => item.day === day.day ? { ...item, end: event.target.value } : item) })} /><img src={`/figma-assets/employees/add-design/time-chevron${day.enabled ? "" : "-disabled"}.svg`} alt="" /></label></div><span className="employee-workday-total"><span>{hoursLabel(dayMinutes(day))}</span></span></div>)}<p className="weekly-hours">Łączna ilość godzin w tygodniu: <strong>{hoursLabel(weekMinutes(draft))}</strong></p></div>
      </section>
    </fieldset>
    {deleting && <ProviderModal titleId="delete-employee-title" onClose={() => { if (!busy) setDeleting(false); }}><h2 id="delete-employee-title">Usuń pracownika</h2><p>Usunąć dane i stały grafik pracownika {employee?.name}? Tej operacji nie można cofnąć.</p><div className="employee-form-actions"><button type="button" disabled={busy} onClick={() => setDeleting(false)}>Anuluj</button><button type="button" disabled={busy} className="employee-delete-button" onClick={remove}>{busy ? "Usuwanie…" : "Usuń pracownika"}</button></div></ProviderModal>}
  </form>;
}
export function ProviderEmployeeFormPage({ mode = "add" }: { mode?: "add" | "edit" }) { return <ProviderShell active="Pracownicy" figmaNode={mode === "edit" ? "5879:10140" : "4049:5328"}><EmployeeForm mode={mode} /></ProviderShell>; }
