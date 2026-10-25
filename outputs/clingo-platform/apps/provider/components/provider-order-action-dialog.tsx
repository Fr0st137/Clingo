"use client";

import { useEffect, useState, type FormEvent } from "react";
import { providerApi } from "../lib/provider-client";
import { timeLabel, type Job } from "../lib/provider-jobs";
import { offerPrice } from "../lib/provider-offers";
import { parseDay, warsawToday } from "../lib/provider-schedule";
import { ProviderModal } from "./provider-modal";

export type OrderAction = "cancelled" | "completed" | "reschedule";
export type OrderActionSelection = { date: string; startMinute: number; startsAt?: string; endsAt?: string };
type Slot = { startsAt: string; endsAt: string };
type Availability = { days: Array<{ date: string; slots: Slot[] }>; maxDate: string };

export function ProviderOrderActionDialog({ action, job, busy, error, conflict, onClose, onReload, onExecute }: {
  action: OrderAction; job: Job; busy: boolean; error: string; conflict: boolean;
  onClose: () => void; onReload: () => void;
  onExecute: (message: string, selection?: OrderActionSelection) => Promise<void>;
}) {
  const [message, setMessage] = useState(""), [choosing, setChoosing] = useState(false);
  const [date, setDate] = useState(job.date < warsawToday() ? warsawToday() : job.date);
  const [time, setTime] = useState(timeLabel(job.startMinute));
  const [month, setMonth] = useState(date.slice(0, 7)), [slot, setSlot] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false), [loadError, setLoadError] = useState(""), [attempt, setAttempt] = useState(0);
  const booking = job.source === "booking";
  const sessionIndex = (job.sessionCount ?? 1) > 1 ? (job.sessionIndex ?? 1) - 1 : undefined;
  useEffect(() => {
    if (!choosing || !booking) return;
    const controller = new AbortController();
    setLoading(true); setLoadError(""); setAvailability(null); setSlot("");
    providerApi<Availability>(`bookings/${job.bookingId}/reschedule-availability`, "POST", { month, sessionIndex }, controller.signal).then(data => {
      setAvailability(data);
      const first = data.days.find(day => day.slots.length);
      if (first) setDate(first.date);
    }).catch(error => { if (!controller.signal.aborted) setLoadError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [choosing, booking, job.bookingId, month, sessionIndex, attempt]);
  const slots = availability?.days.find(day => day.date === date)?.slots ?? [];
  const title = choosing ? "Wybierz nowy termin zamówienia:" : action === "cancelled" ? "Odwołaj termin zamówienia:" : action === "reschedule" ? "Przełóż termin zamówienia:" : `Oznacz zlecenie ${(job.sessionCount ?? 1) > 1 ? "wielosesyjne" : "jednosesyjne"}, jako wykonane`;
  const shortDate = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(parseDay(job.date));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || conflict) return;
    if (action === "reschedule" && !choosing) { setChoosing(true); return; }
    if (action !== "reschedule") { await onExecute(message); return; }
    if (booking) {
      const selected = slots.find(row => row.startsAt === slot);
      if (!selected) return;
      await onExecute(message, { date, startMinute: job.startMinute, ...selected });
    } else {
      const [hour, minute] = time.split(":").map(Number);
      await onExecute(message, { date, startMinute: hour * 60 + minute });
    }
  }
  return <ProviderModal className={`order-action-modal is-${action}`} titleId="order-action-title" onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit}>
      <div className="order-action-copy">
        <h2 id="order-action-title">{title}</h2>
        <div className="order-action-summary"><span>{job.clientName}</span><i><img src="/figma-assets/orders/actions/divider.svg" alt="" /></i><span>{shortDate}, {timeLabel(job.startMinute)}</span><i><img src="/figma-assets/orders/actions/divider.svg" alt="" /></i><span>{offerPrice(job.priceMinor)}</span></div>
        {action !== "completed" && !choosing && <div className="order-action-message"><label htmlFor="order-action-message">Wiadomość do klienta (opcjonalne)</label><textarea id="order-action-message" maxLength={100} value={message} disabled={busy} onChange={event => setMessage(event.target.value)} placeholder={action === "cancelled" ? "Wpisz powód anulacji zlecenia..." : "Wpisz powód i propozycje nowego terminu zlecenia..."} /><span>{message.length}/100</span></div>}
        {choosing ? <div className="order-action-date-fields">
          {booking && <label>Miesiąc<input type="month" value={month} min={warsawToday().slice(0,7)} disabled={busy || loading} onChange={event => { if (event.target.value) setMonth(event.target.value); }} /></label>}
          {loading ? <p role="status">Wczytywanie dostępnych terminów…</p> : loadError ? <div role="alert"><p>{loadError}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Spróbuj ponownie</button></div> : <>
            <label>Nowa data<input type="date" required value={date} min={warsawToday()} max={booking ? availability?.maxDate : "2099-12-31"} disabled={busy} onChange={event => { if (event.target.value) { setDate(event.target.value); setSlot(""); if (booking && event.target.value.slice(0,7) !== month) setMonth(event.target.value.slice(0,7)); } }} /></label>
            {booking ? <label>Godzina<select required value={slot} disabled={busy || !slots.length} onChange={event => setSlot(event.target.value)}><option value="">{slots.length ? "Wybierz godzinę" : "Brak wolnych godzin w tym dniu"}</option>{slots.map(row => <option key={row.startsAt} value={row.startsAt}>{new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(new Date(row.startsAt))}</option>)}</select></label> : <label>Nowa godzina<input type="time" required value={time} disabled={busy} onChange={event => setTime(event.target.value)} /></label>}
          </>}
          <p>Czas trwania i cena zamówienia pozostaną bez zmian. Terminy według czasu polskiego.</p>
        </div> : <>
          <p className="order-action-warning"><strong>UWAGA!</strong><br />{action === "cancelled" ? "Przed odwołaniem zlecenia zaleca się poinformować klienta przez chat lub telefonicznie." : action === "reschedule" ? "Przed przełożeniem zlecenia zaleca się ustalić z klientem przez chat lub telefonicznie szczegóły nowego terminu." : "Po oznaczeniu zamówienia jako wykonane, termin zamówienia w kalendarzu zostanie zwolniony. Pracownicy będą dostępni w czasie, który wcześniej był przeznaczony na zamówienie, a klienci będą mogli zarezerwować ten slot ponownie."}</p>
          {action !== "completed" && <p className="order-action-delivery">Wiadomość zostanie zapisana przy zamówieniu. Powiadomienia email i SMS nie są jeszcze dostępne.</p>}
        </>}
        {booking && action !== "reschedule" && (job.sessionCount ?? 1) > 1 && <p className="order-action-delivery">Zmiana dotyczy całej rezerwacji, łącznie ze wszystkimi sesjami.</p>}
        {error && <div className="order-action-error" role="alert"><p>{error}</p>{conflict && <button type="button" disabled={busy} onClick={onReload}>Wczytaj aktualne dane</button>}</div>}
      </div>
      <div className="order-action-buttons">
        <button type="button" className={action === "cancelled" ? "is-primary" : ""} disabled={busy} onClick={onClose}>Anuluj</button>
        <button type="submit" className={action === "cancelled" ? "is-danger" : "is-primary"} disabled={busy || conflict || choosing && booking && (loading || !!loadError || !slot)}>{busy ? "Zapisywanie…" : action === "cancelled" ? "Odwołaj" : action === "completed" ? "Wykonane" : choosing ? "Zapisz nowy termin" : "Kontynuuj"}</button>
      </div>
    </form>
  </ProviderModal>;
}
