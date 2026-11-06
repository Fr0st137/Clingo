"use client";
import { accessMethodLabel } from "../../api/src/dashboard/booking-access";
import { BookingPhotoGallery } from "../../web/components/booking-photo-gallery";
import { useState } from "react";
import { providerApi, ApiError } from "../lib/provider-client";
import { jobStatuses, timeLabel, type Job } from "../lib/provider-jobs";
import { ProviderModal } from "./provider-modal";

export function ProviderBookingDetails({ job, onClose, onSaved, onReloaded }: { job: Job; onClose: () => void; onSaved: (job: Job) => void; onReloaded: (job: Job) => void }) {
  const [current, setCurrent] = useState(job), [busy, setBusy] = useState(false), [error, setError] = useState(""), [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState<"completed" | "cancelled" | null>(null);
  async function reload() {
    setBusy(true); setError("");
    try { const rows = await providerApi<Job[]>(`bookings/${current.bookingId}`); const fresh = rows.find(row => row.id === current.id) ?? rows[0]; setCurrent(fresh); onReloaded(fresh); setConflict(false); setConfirm(null); window.dispatchEvent(new Event("provider-bookings-changed")); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  async function update() {
    if (busy || !confirm) return;
    setBusy(true); setError("");
    try { const rows = await providerApi<Job[]>(`bookings/${current.bookingId}`, "PUT", { status: confirm, revision: current.revision }); window.dispatchEvent(new Event("provider-bookings-changed")); onSaved(rows.find(row => row.id === current.id) ?? rows[0]); }
    catch (error) { setError((error as Error).message); setConflict(error instanceof ApiError && error.status === 409); } finally { setBusy(false); }
  }
  return <ProviderModal className="client-editor job-editor" titleId="booking-details-title" onClose={() => { if (!busy) onClose(); }}>
    <h2 id="booking-details-title">Rezerwacja ze strony Clingo</h2>
    <p><strong>{current.serviceTitle}</strong> · {jobStatuses[current.status]}</p>
    <p>{current.date}, {timeLabel(current.startMinute)}–{timeLabel(current.startMinute + current.durationMinutes)} (czas polski){(current.sessionCount ?? 1) > 1 && <> · Sesja {current.sessionIndex}/{current.sessionCount}</>}</p>
    <p><strong>{current.clientName}</strong><br />{current.address}</p>
    <p>{current.clientPhone && <><a href={`tel:${current.clientPhone.replace(/[^+\d]/g, "")}`}>{current.clientPhone}</a><br /></>}{current.clientEmail && <a href={`mailto:${current.clientEmail}`}>{current.clientEmail}</a>}</p>
    {current.summary && <><h3>Podsumowanie całej rezerwacji</h3>{current.summary.lines.map(line => <p key={line.id}>{line.label}: {line.value}</p>)}<p><strong>Razem: {current.summary.total}</strong> · {current.summary.duration}</p></>}
    <p><strong>Sposób udostępnienia lokalu</strong><br />{accessMethodLabel(current.accessMethod)}</p>
    {!!current.customerPhotos?.length && current.bookingId && <section><h3>Zdjęcia od klienta</h3><BookingPhotoGallery photos={current.customerPhotos} orderId={current.bookingId} provider /></section>}
    {current.notes && <p style={{ whiteSpace: "pre-wrap" }}><strong>Uwagi klienta</strong><br />{current.notes}</p>}
    {current.invoice && <p><strong>Dane do faktury</strong><br />{current.invoice.companyName}<br />NIP: {current.invoice.taxId}<br />{current.invoice.address}</p>}
    <p className="team-help">Status jest wspólny z kontem klienta i dotyczy całej rezerwacji, łącznie ze wszystkimi sesjami. Kwota nie potwierdza otrzymania płatności.</p>
    {error && <p role="alert" className="provider-feedback is-error">{error}</p>}
    {conflict ? <button type="button" className="settings-button" disabled={busy} onClick={reload}>Wczytaj aktualne dane</button> : confirm ? <div><p>{confirm === "cancelled" ? "Odwołać całą rezerwację? Terminy zostaną zwolnione, a klient zobaczy odwołanie na swoim koncie." : "Potwierdzić wykonanie całej rezerwacji? Klient będzie mógł wystawić opinię."}</p><div className="settings-live-actions"><button className="settings-button" disabled={busy} onClick={() => setConfirm(null)}>Wróć</button><button className="employee-save-button" disabled={busy} onClick={update}>{busy ? "Zapisywanie…" : "Potwierdź"}</button></div></div> : <div className="settings-live-actions"><button className="settings-button" disabled={busy} onClick={onClose}>Zamknij</button>{current.status === "scheduled" && <><button className="settings-button" disabled={busy} onClick={() => setConfirm("cancelled")}>Odwołaj rezerwację</button><button className="employee-save-button" disabled={busy} onClick={() => setConfirm("completed")}>Oznacz jako wykonane</button></>}</div>}
  </ProviderModal>;
}
