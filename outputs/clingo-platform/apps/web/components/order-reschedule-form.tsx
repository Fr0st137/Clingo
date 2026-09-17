"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderCardData } from "./order-card";
import { bookingDate, bookingDayLabel, bookingTime, type BookingSlot } from "../lib/booking-client";
import type { RescheduleActions, RescheduleAvailability } from "../lib/order-reschedule";
import { PreviewCalendar, TimePicker, type Period } from "./schedule-date-time-picker";

export function OrderRescheduleForm({ order, initialSessionIndex, loadAvailability, save }: RescheduleActions & { order: OrderCardData; initialSessionIndex?: number }) {
  const router = useRouter();
  const sessions = order.bookingDetails?.sessions ?? [];
  const [sessionIndex, setSessionIndex] = useState(() => sessions.length ? (Number.isInteger(initialSessionIndex) && initialSessionIndex! >= 0 && initialSessionIndex! < sessions.length ? initialSessionIndex : 0) : undefined);
  const [month, setMonth] = useState(() => {
    const start = sessionIndex === undefined ? undefined : sessions[sessionIndex]?.startsAt;
    return start && Date.parse(start) > Date.now() ? bookingDate(new Date(start)).slice(0, 7) : bookingDate().slice(0, 7);
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [period, setPeriod] = useState<Period>("Rano");
  const [availability, setAvailability] = useState<RescheduleAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const returnHref = `/zamowienia/szczegoly?id=${encodeURIComponent(order.id ?? "")}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAvailability(null);
    setSelectedSlot(null);
    setError("");
    loadAvailability(month, sessionIndex).then(result => {
      if (!active) return;
      if (result.error !== undefined) { setError(result.error); return; }
      setAvailability(result.data);
      setSelectedDate(date => result.data.days.some(day => day.date === date && day.slots.length) ? date : "");
    }).catch(() => { if (active) setError("Nie udało się pobrać terminów. Spróbuj ponownie."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, sessionIndex, revision, loadAvailability]);

  const slots = availability?.days.find(day => day.date === selectedDate)?.slots ?? [];
  const unchanged = selectedSlot?.startsAt === availability?.currentStartsAt;
  const avatar = order.logo === "stepapp" ? "/figma-assets/favorite-stepapp.png" : order.avatar === "klaudia" ? "/figma-assets/order-klaudia.png" : order.avatar === "paulina" ? "/figma-assets/order-paulina.png" : null;

  async function submit() {
    if (!selectedSlot || saving || loading || unchanged) return;
    setSaving(true);
    setError("");
    try {
      const result = await save(selectedSlot.startsAt, selectedSlot.endsAt, sessionIndex);
      if (result.error !== undefined) { setError(result.error); setSelectedSlot(null); return; }
      router.push(returnHref);
      router.refresh();
    } catch { setError("Nie udało się potwierdzić zmiany. Sprawdź szczegóły zamówienia przed ponowną próbą."); }
    finally { setSaving(false); }
  }

  return <form onSubmit={event => { event.preventDefault(); void submit(); }} className="grid gap-[20px] text-[14px] text-[#2e3b4c]">
    {sessions.length ? <label className="grid max-w-[540px] gap-[10px]">Sesja do przełożenia
      <select className="rounded-[15px] border border-[#e5e7eb] bg-white p-[15px]" value={sessionIndex} disabled={saving} onChange={event => { setSessionIndex(Number(event.target.value)); setSelectedDate(""); setSelectedSlot(null); }}>
        {sessions.map((session, index) => <option key={index} value={index}>Sesja {index + 1} · {bookingDayLabel(session.startsAt)} · {bookingTime(session.startsAt)}–{bookingTime(session.endsAt)}</option>)}
      </select>
    </label> : null}
    <div className="grid grid-cols-1 items-start gap-[30px] rounded-[30px] bg-[#f9fafb] p-[15px] sm:p-[30px] lg:grid-cols-2" data-node-id="5053:8649">
      <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
        <PreviewCalendar availability={availability} loading={loading} month={month} selectedDate={selectedDate} currentDate={availability ? bookingDate(new Date(availability.currentStartsAt)) : undefined} variant="reschedule"
          onMonthChange={delta => { const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + delta); setMonth(date.toISOString().slice(0, 7)); setSelectedSlot(null); }}
          onSelect={date => { setSelectedDate(date); setSelectedSlot(null); setError(""); }} />
      </fieldset>
      <div className="grid min-w-0 gap-[30px]">
        <div className="flex min-h-[71px] items-center justify-between gap-[10px] rounded-[20px] border border-[#e5e7eb] bg-white p-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          <div className="flex min-w-0 items-center gap-[10px]">
            {avatar ? <img alt="" src={avatar} width={41} height={41} className="h-[41px] w-[41px] shrink-0 rounded-full object-contain" /> : null}
            <div className="min-w-0"><p className="m-0 font-medium">{order.provider}</p><p className="m-0 text-[#7c8691]">{order.details}</p></div>
          </div>
          {availability ? <span className="shrink-0 rounded-full bg-[#f0f2f4] px-[10px] py-[4px] text-[13px] text-[#7c8691]">{availability.duration}</span> : null}
        </div>
        <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
          <TimePicker period={period} onPeriodChange={setPeriod} selectedTime={selectedSlot?.time ?? null} slots={slots} loading={loading} availabilityStart="00:00" availabilityEnd="23:59" onTimeSelect={slot => { setSelectedSlot(slot); setError(""); }} variant="reschedule" />
        </fieldset>
        <div className="flex flex-wrap justify-end gap-[10px]">
          <Link aria-disabled={saving} onClick={event => { if (saving) event.preventDefault(); }} href={returnHref} className="rounded-full border border-[#e5e7eb] bg-[#f4f6f9] px-[35px] py-[16px] hover:bg-[#e6edf3]">Anuluj</Link>
          <button type="submit" disabled={!selectedSlot || loading || saving || unchanged} className="rounded-full bg-[#0079de] px-[35px] py-[16px] font-medium text-white hover:bg-[#006bc5] disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Zapisywanie…" : "Przełóż zlecenie"}</button>
        </div>
      </div>
    </div>
    <div aria-live="polite" className="px-[15px] text-[#7c8691]">
      {loading ? <p>Wczytywanie dostępnych terminów…</p> : availability ? <>
        <p>Obecny termin: {bookingDayLabel(availability.currentStartsAt)}, {bookingTime(availability.currentStartsAt)}–{bookingTime(availability.currentEndsAt)}.</p>
        <p>{selectedSlot ? `Nowy termin: ${bookingDayLabel(selectedSlot.startsAt)}, ${bookingTime(selectedSlot.startsAt)}–${bookingTime(selectedSlot.endsAt)}.` : selectedDate ? `Wybierz godzinę na ${bookingDayLabel(selectedDate)}.` : "Wybierz dostępny dzień w kalendarzu, a następnie godzinę."}</p>
        {!availability.days.some(day => day.slots.length) ? <p>Brak wolnych terminów w tym miesiącu.</p> : null}
      </> : null}
    </div>
    {error ? <div role="alert" className="rounded-[15px] border border-red-200 bg-red-50 p-[15px] text-red-700">{error}<button type="button" disabled={saving || loading} className="ml-[15px] underline" onClick={() => setRevision(value => value + 1)}>Odśwież terminy</button></div> : null}
  </form>;
}
