"use client";

import { useRef, useState } from "react";
import { ApiError, hoursLabel, initials, providerApi, type Employee } from "../lib/provider-client";
import { jobStatuses, manualJobPayload, orderActionNotes, timeLabel, type Job } from "../lib/provider-jobs";
import { offerPrice } from "../lib/provider-offers";
import { parseDay } from "../lib/provider-schedule";
import { ProviderModal } from "./provider-modal";
import { useSettingsResource, useUnsavedSettings } from "./provider-settings-state";
import { ProviderOrderActionDialog, type OrderAction, type OrderActionSelection } from "./provider-order-action-dialog";
import { ProviderBookingStaffing } from "./provider-booking-staffing";
import Link from "next/link";
import {projectHref} from "../lib/provider-projects";
import {ProviderSavedProjectNotes} from "./provider-project-notes-dialog";
import {ProviderSavedOrderHistory} from "./provider-order-history-dialog";

const asset = (name: string) => `/figma-assets/orders/details/${name}`;
type Panel = "employees" | "comments" | "notes" | "history" | "contact" | "service" | null;

export function ProviderOrderDetails({ job, onClose, onSaved, onReloaded, onEdit }: {
  job: Job; onClose: () => void; onSaved: (job: Job) => void; onReloaded: (job: Job) => void; onEdit: (job: Job) => void;
}) {
  const [current, setCurrent] = useState(job);
  const [tab, setTab] = useState<"details" | "extras">("details");
  const [panel, setPanel] = useState<Panel>(null);
  const [confirm, setConfirm] = useState<OrderAction | "close" | null>(null);
  const [notes, setNotes] = useState(job.notes);
  const [projectNotesOpen, setProjectNotesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [conflict, setConflict] = useState(false);
  const pending = useRef(false);
  const employees = useSettingsResource<Employee[]>("employees");
  const booking = current.source === "booking";
  const project = current.isProject || (current.sessionCount??0)>1 || !!current.multiOrderId;
  const projectLink = projectHref(booking?"booking":"manual",current.bookingId??current.multiOrderId??"");
  const dirty = !booking && notes !== current.notes;
  useUnsavedSettings(dirty);
  const addOns = current.addOns ?? [];
  const area = current.summary?.lines.map(line => (line.label + " " + line.value).match(/\d+(?:[,.]\d+)?\s*(?:m²|m2|szt\.?)/i)?.[0]).find(Boolean);
  const frequency = current.frequencyLabel ?? ((current.sessionCount ?? 1) > 1 ? `${current.sessionCount} sesji` : "Jednorazowa");
  const address = current.address.split(/,\s*/);
  const identifier = current.bookingId ?? current.id;
  const date = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(parseDay(current.date));
  const close = () => { if (!pending.current) { if (dirty) setConfirm("close"); else onClose(); } };
  const togglePanel = (value: Panel) => setPanel(previous => previous === value ? null : value);

  async function reload() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const fresh = booking ? (await providerApi<Job[]>(`bookings/${current.bookingId}`)).find(row => row.id === current.id) : await providerApi<Job>(`jobs/${current.id}`);
      if (!fresh) throw new Error("Nie znaleziono zamówienia. Odśwież listę zamówień.");
      setCurrent(fresh); setNotes(fresh.notes); setConflict(false); setConfirm(null); onReloaded(fresh);
    } catch (error) { setError((error as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  async function update(changes: Parameters<typeof manualJobPayload>[1], finish = false, bookingAction?: { message: string; startsAt?: string; endsAt?: string }) {
    if (pending.current || conflict) return;
    pending.current = true; setBusy(true); setError("");
    try {
      let fresh: Job;
      if (booking) {
        const rescheduling = !!bookingAction?.startsAt;
        const rows = await providerApi<Job[]>(`bookings/${current.bookingId}${rescheduling ? "/reschedule" : ""}`, "PUT", rescheduling ? { revision: current.revision, ...bookingAction, ...((current.sessionCount ?? 1) > 1 ? { sessionIndex: (current.sessionIndex ?? 1) - 1 } : {}) } : { status: changes?.status, revision: current.revision, message: bookingAction?.message });
        fresh = rows.find(row => rescheduling ? row.startsAt === bookingAction?.startsAt : row.id === current.id) ?? rows[0];
      } else fresh = await providerApi<Job>(`jobs/${current.id}`, "PUT", manualJobPayload(current, changes));
      setCurrent(fresh); setNotes(fresh.notes); setConfirm(null); setPanel(null);
      window.dispatchEvent(new Event("provider-bookings-changed"));
      if (finish) onSaved(fresh); else onReloaded(fresh);
    } catch (error) { setError((error as Error).message); setConflict(error instanceof ApiError && error.status === 409); }
    finally { pending.current = false; setBusy(false); }
  }
  async function executeAction(message: string, selection?: OrderActionSelection) {
    if (!confirm || confirm === "close") return;
    try {
      const nextNotes = !booking && confirm !== "completed" ? orderActionNotes(current.notes, confirm, message) : current.notes;
      if (confirm === "reschedule") {
        if (!selection) return;
        await update({ date: selection.date, startMinute: selection.startMinute, notes: nextNotes }, true, { message, startsAt: selection.startsAt, endsAt: selection.endsAt });
      } else await update({ status: confirm, notes: nextNotes }, true, { message });
    } catch (error) { setError((error as Error).message); }
  }
  return <ProviderModal className="order-details-drawer" titleId="order-details-title" onClose={close}>
    <h2 className="sr-only" id="order-details-title">Szczegóły zamówienia — {current.clientName}</h2>
    <div className="order-details-top">
      <button className="order-details-close" type="button" aria-label="Zamknij szczegóły zamówienia" disabled={busy} onClick={close}><span /><span /></button>
      <div className="order-details-actions">
        {!(project&&!booking)&&<button className="is-cancel" type="button" disabled={busy || current.status !== "scheduled" || conflict || dirty} onClick={() => setConfirm("cancelled")}>Odwołaj<img src={asset("cancel.svg")} alt="" /></button>}
        {project?current.status==="scheduled"&&!dirty&&<Link className="settings-button" href={projectLink}>Zakończ projekt</Link>:<button className="is-complete" type="button" disabled={busy || current.status !== "scheduled" || conflict || dirty} onClick={() => setConfirm("completed")}>Wykonane<img src={asset("completed.svg")} alt="" /></button>}
        {!project&&<button className="is-primary" type="button" disabled={busy || current.status !== "scheduled" || conflict || dirty} onClick={() => setConfirm("reschedule")}>Przełóż dzień<img src={asset("reschedule.svg")} alt="" /></button>}
      </div>
    </div>
    <div className="order-details-number"><span title={identifier}>Zamówienie nr {identifier.replaceAll("-", "").slice(0, 11).toUpperCase()}</span><span className="order-details-divider"><img src={asset("divider.svg")} alt="" /></span></div>
    {current.status !== "scheduled" && <p className={`order-details-status is-${current.status}`} role="status">{jobStatuses[current.status]}</p>}
    {current.releasedByCompletion&&<p role="status">Termin zwolniony po zakończeniu całego projektu.</p>}
    {current.estimatedWorkers && <p className="team-help">Czas realizacji obliczony dla {current.estimatedWorkers} {current.estimatedWorkers === 1 ? "pracownika" : "pracowników"}.</p>}
    {project&&<p><Link className="settings-button" href={projectLink}>Edytuj projekt i sesje</Link></p>}
    <div className="order-details-tabs" role="tablist" aria-label="Dane zamówienia">
      <button type="button" id="order-tab-details" role="tab" aria-selected={tab === "details"} aria-controls="order-content" onClick={() => setTab("details")}>Szczegóły</button>
      <button type="button" id="order-tab-extras" role="tab" aria-selected={tab === "extras"} aria-controls="order-content" onClick={() => setTab("extras")}>Usługi dodatkowe <span>{addOns.length}</span></button>
    </div>
    <div id="order-content" role="tabpanel" aria-labelledby={tab === "details" ? "order-tab-details" : "order-tab-extras"} className="order-details-content">
      {tab === "details" ? <>
        <div className="order-details-client">
          <div className="order-details-person"><div><strong>{current.clientName}</strong>{current.clientPhone ? <a href={`tel:${current.clientPhone.replace(/[^+\d]/g, "")}`}>{current.clientPhone}</a> : <span>Brak telefonu</span>}</div><button className="order-details-chat" type="button" aria-label="Kontakt z klientem" aria-expanded={panel === "contact"} onClick={() => togglePanel("contact")}><img src={asset("chat.svg")} alt="" /></button></div>
          <div className="order-details-meta"><span>Powierzchnia / sztuki</span><div title={area ? undefined : "Nie podano powierzchni ani liczby sztuk"}>{area ?? "—"}<img src={asset("area.svg")} alt="" /></div></div>
          <div className="order-details-meta"><span>Częstotliwość usługi</span><div>{frequency}<img src={asset("repeat.svg")} alt="" /></div></div>
        </div>
        <button className="order-details-service" type="button" aria-expanded={panel === "service"} onClick={() => togglePanel("service")}><span className="order-details-service-copy"><strong>{current.serviceTitle}</strong><span>{booking ? "Rezerwacja ze strony Clingo" : "Zamówienie jednorazowe"}</span></span><strong>{offerPrice(current.priceMinor)}</strong><img src={asset("service-angle.svg")} alt="" /></button>
        <div className="order-details-time"><div><span>Termin realizacji</span><p>{date}</p></div><div className="order-details-hour">{timeLabel(current.startMinute)}<img src={asset("clock.svg")} alt="" /></div><div className="order-details-duration"><span>{hoursLabel(current.durationMinutes)}</span><img src={asset("time-arrow.svg")} alt="" /></div><div className="order-details-hour">{timeLabel(current.startMinute + current.durationMinutes)}<img src={asset("clock.svg")} alt="" /></div></div>
        <div className="order-details-address"><div><p>{address[0] || "Nie podano adresu"}</p><p><img src={asset("map.svg")} alt="" />{address.slice(1).join(", ") || "Adres realizacji"}</p></div>{current.address && <a className="order-details-maps" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(current.address)}`} target="_blank" rel="noreferrer">Google Maps<img src={asset("maps.png")} alt="" /></a>}</div>
        <div className="order-details-staff">
          <div className="order-details-staff-heading"><button type="button" disabled={busy || current.status !== "scheduled" || conflict || dirty} onClick={() => togglePanel("employees")}>Zmień obsadę<img src={asset("plus.svg")} alt="" /></button><span>{current.employeeId ? `Przypisani pracownicy: ${current.employees?.length || 1}` : "Brak przypisanego pracownika"}</span></div>
          {(current.employees ?? (current.employeeId ? [{ id: current.employeeId, name: current.employeeName }] : [])).map(employee => <div className="order-details-employee" key={employee.id}><span className="order-details-avatar">{initials(employee.name)}</span><span>{employee.name}</span><button type="button" disabled={busy || current.status !== "scheduled" || conflict || dirty} onClick={() => togglePanel("employees")}>Zamień</button>{!booking && !project && <button className="order-details-remove" type="button" aria-label={`Usuń przypisanie — ${employee.name}`} disabled={busy || conflict || dirty} onClick={() => void update({ employeeId: null })}><img src={asset("remove.svg")} alt="" /></button>}</div>)}
          <button type="button" className="order-details-expand" aria-expanded={panel === "employees"} onClick={() => togglePanel("employees")}><img src={asset("expand.svg")} alt="" />Pełna lista</button>
        </div>
      </> : <div className="order-details-extra-list">{addOns.length ? addOns.map(item => <div key={item.id}><strong>{item.label}</strong><span>{item.quantity} szt.</span></div>) : <p>Brak usług dodatkowych w tym zamówieniu.</p>}</div>}
    </div>
    {panel && <section className="order-details-panel" aria-label="Dodatkowe informacje">
      {panel === "employees" && (project?<p><Link href={projectLink}>Zmień obsadę w edytorze projektu</Link>, aby przeliczyć i potwierdzić bilans pracy.</p>:booking ? current.status === "scheduled" ? <ProviderBookingStaffing job={current} onSaved={fresh => { setCurrent(fresh); onReloaded(fresh); }} /> : <p>Obsadę można zmienić w aktywnej rezerwacji.</p> : <><h3>Pracownicy</h3>{employees.loading ? <p role="status">Wczytywanie…</p> : employees.error ? <><p role="alert">{employees.error}</p><button type="button" onClick={employees.reload}>Spróbuj ponownie</button></> : <>{!employees.data?.length && <p>Dodaj pracownika w zakładce Pracownicy.</p>}{employees.data?.map(employee => <button className="order-details-pick-employee" type="button" key={employee.id} disabled={busy || conflict || dirty || employee.id === current.employeeId} onClick={() => void update({ employeeId: employee.id })}><span className="order-details-avatar">{initials(employee.name)}</span>{employee.name}<span>{employee.id === current.employeeId ? "Przypisany" : "Przypisz"}</span></button>)}</>}</>)}
      {panel === "contact" && <><h3>Kontakt z klientem</h3>{current.clientPhone && <p><a href={`tel:${current.clientPhone.replace(/[^+\d]/g, "")}`}>{current.clientPhone}</a></p>}{current.clientEmail && <p><a href={`mailto:${current.clientEmail}`}>{current.clientEmail}</a></p>}{!current.clientPhone && !current.clientEmail && <p>Brak danych kontaktowych.</p>}</>}
      {panel === "service" && <><h3>Podsumowanie usługi</h3>{current.summary?.lines.map(line => <p key={line.id}>{line.label}: {line.value}</p>)}<p>Czas realizacji: {hoursLabel(current.durationMinutes)}</p><p>Kwota: {offerPrice(current.priceMinor)}</p>{(current.sessionCount ?? 1) > 1 && <p>Sesja {current.sessionIndex}/{current.sessionCount}. Cała rezerwacja: {current.summary?.total}</p>}{!booking && !project && <button type="button" className="order-details-edit" disabled={busy || dirty} onClick={() => onEdit(current)}>Edytuj zamówienie</button>}</>}
      {panel === "comments" && <><h3>Uwagi klienta</h3><p className="order-details-note-text">{booking && current.notes ? current.notes : "Brak zapisanych uwag klienta."}</p>{current.invoice && <p>Dane do faktury: {current.invoice.companyName}, NIP {current.invoice.taxId}, {current.invoice.address}</p>}</>}
      {panel === "history" && <><h3>Historia zmian</h3><p>Aktualna wersja: {current.revision}. Status: {jobStatuses[current.status]}.</p>{current.providerMessages?.map((entry, index) => <p key={index}>{entry.type === "cancelled" ? "Odwołanie" : "Przełożenie"}: {entry.message}</p>)}<p>Pełna historia zmian nie jest jeszcze dostępna.</p></>}
      {panel === "notes" && <><h3>Notatki i zdjęcia</h3>{booking ? <p>Notatki własne i zdjęcia do rezerwacji klienta nie są jeszcze dostępne.</p> : <><label className="order-details-notes-label">Notatka do zamówienia<textarea maxLength={2000} rows={4} value={notes} disabled={busy} onChange={event => setNotes(event.target.value)} /></label><button className="order-details-edit" type="button" disabled={busy || conflict || !dirty} onClick={() => void update({ notes })}>{busy ? "Zapisywanie…" : "Zapisz notatkę"}</button><p>Dodawanie zdjęć nie jest jeszcze dostępne.</p></>}</>}
    </section>}
    {error && (!confirm || confirm === "close") && <div className="provider-feedback is-error" role="alert">{error}{conflict && <button type="button" disabled={busy} onClick={() => void reload()}>Wczytaj aktualne dane</button>}</div>}
    {confirm === "close" && <section className="order-details-confirm" aria-label="Potwierdzenie operacji"><h3>Odrzucić niezapisaną notatkę?</h3><div><button type="button" onClick={() => setConfirm(null)}>Wróć</button><button className="order-details-edit" type="button" onClick={onClose}>Potwierdź</button></div></section>}
    <div className="order-details-footer">
      <button type="button" aria-expanded={panel === "comments"} onClick={() => togglePanel("comments")}>Uwagi klienta<img src={asset("comments.svg")} alt="" />{booking && current.notes && <span className="order-details-count">1</span>}</button>
      <button type="button" aria-expanded={historyOpen || panel === "history"} onClick={() => current.multiOrderId || booking && project ? setHistoryOpen(true) : togglePanel("history")}>Historia zmian<img className="order-details-history-icon" src={asset("history.svg")} alt="" /></button>
      <button type="button" aria-expanded={current.multiOrderId ? projectNotesOpen : panel === "notes"} onClick={() => current.multiOrderId && !booking ? setProjectNotesOpen(true) : togglePanel("notes")}>Notatki i zdjęcia<img src={asset("notes.svg")} alt="" />{!booking && !current.multiOrderId && current.notes && <span className="order-details-count">1</span>}</button>
    </div>
    {confirm && confirm !== "close" && <ProviderOrderActionDialog action={confirm} job={current} busy={busy} error={error} conflict={conflict} onClose={() => { if (!busy) { setConfirm(null); setError(""); } }} onReload={() => void reload()} onExecute={executeAction} />}
    {projectNotesOpen&&current.multiOrderId&&<ProviderSavedProjectNotes projectId={current.multiOrderId} onClose={()=>setProjectNotesOpen(false)} onSaved={()=>window.dispatchEvent(new Event("provider-projects-changed"))}/>}
    {historyOpen&&<ProviderSavedOrderHistory source={booking?"booking":"manual"} id={current.bookingId??current.multiOrderId??""} onClose={()=>setHistoryOpen(false)}/>}
  </ProviderModal>;
}
