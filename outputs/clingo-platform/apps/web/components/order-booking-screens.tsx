"use client";

import Link from "next/link";
import Image from "next/image";

import { ArrowRight, CalendarCheck, Check, ChevronLeft, ChevronRight, Mail, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { OrderHeader } from "./order-header";
import { OrderProcessShell } from "./order-process-shell";
import { MultiSessionScheduleScreen } from "./multi-session-schedule-screen";
import type { OrderCardData } from "./order-card";
import type { BookingAvailability, BookingDraft, BookingPageProps, BookingQuote } from "../lib/booking-client";
import { BookingError, bookingDate, bookingDayLabel, bookingTime, postBooking } from "../lib/booking-client";
import { isMultiSessionBookingState, multiSessionDateValue, multiSessionIso, multiSessionStorageKey, type MultiSessionBookingSession } from "../lib/multi-session-booking";

function useDraft(props: BookingPageProps) {
  const key = `clingo-booking:${props.user.id}:${JSON.stringify(props.selection)}:${props.initialAddress}`;
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<BookingDraft>({ startsAt: "", address: props.initialAddress || [props.user.street, props.user.postalCode, props.user.city].filter(Boolean).join(", "),
    apartment: props.user.apartment ?? "", notes: "", contactName: [props.user.firstName, props.user.lastName].filter(Boolean).join(" "), contactPhone: props.user.phone ?? "",
    invoiceRequested: false, companyName: props.user.companyName ?? "", taxId: "", invoiceAddress: "", requestId: "" });
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
      setDraft(current => {
        const next = { ...current, requestId: crypto.randomUUID() };
        if (saved && typeof saved === "object") {
          for (const field of Object.keys(next) as Array<keyof BookingDraft>) {
            if (typeof saved[field] === typeof next[field]) Object.assign(next, { [field]: saved[field] });
          }
        }
        return next;
      });
    } catch { setDraft(current => ({ ...current, requestId: crypto.randomUUID() })); }
    setReady(true);
  }, [key]);
  const update = (values: Partial<BookingDraft>) => {
    setDraft(current => {
      const next = { ...current, ...values, requestId: crypto.randomUUID() };
      try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* The form still works when browser storage is full. */ }
      return next;
    });
  };
  const save = () => { try { sessionStorage.setItem(key, JSON.stringify(draft)); } catch { /* Keep the visible form available. */ } };
  return { draft, update, ready, save, key };
}

function ProviderLine({ profile, size = 41 }: { profile: BookingPageProps["profile"]; size?: 41 | 53 }) {
  const src = profile.id === "stepapp" ? "/figma-assets/board-stepapp-logo.png" : profile.id === "mobimop" ? "/figma-assets/board-mobimop-logo.png" : "/figma-assets/board-avatar-paulina.png";
  return <div className="flex min-w-0 items-center gap-[10px]">
    <div className="relative shrink-0 overflow-hidden rounded-[30px] shadow-[0_1px_2px_rgba(0,0,0,0.16)]" style={{ height: size, width: size }}><Image width={size} height={size} sizes={`${size}px`} alt="" className="h-full w-full object-contain" src={src} /></div>
    <div className="min-w-0"><p className="m-0 truncate text-[14px] font-medium leading-5 text-[#2e3b4c]">{profile.provider}</p><p className="m-0 truncate text-[14px] leading-5 text-[#7c8691]">{profile.service}</p></div>
  </div>;
}

function ErrorNotice({ message, status, backHref }: { message: string; status?: number; backHref: string }) {
  if (!message) return null;
  return <div role="alert" className="rounded-[15px] border border-[#f4c7ca] bg-[#fff5f5] p-[15px] text-[14px] leading-5 text-[#b52a35]">
    {message}
    {status === 401 ? <Link className="mt-2 block font-medium underline" href={`/logowanie?next=${encodeURIComponent(backHref)}`}>Zaloguj się ponownie</Link> : null}
  </div>;
}

function SingleSessionOrderDateScreen(props: BookingPageProps) {
  const router = useRouter();
  const { draft, update, ready, save } = useDraft(props);
  const [month, setMonth] = useState(() => bookingDate().slice(0, 7));
  const [date, setDate] = useState(() => bookingDate());
  const [period, setPeriod] = useState(0);
  const [data, setData] = useState<BookingAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number>();
  const [revision, setRevision] = useState(0);
  const initialized = useRef(false);
  useEffect(() => {
    if (ready && !initialized.current) {
      initialized.current = true;
      if (draft.startsAt && Number.isFinite(Date.parse(draft.startsAt)) && bookingDate(new Date(draft.startsAt)) >= bookingDate()) {
        setMonth(bookingDate(new Date(draft.startsAt)).slice(0, 7)); setDate(bookingDate(new Date(draft.startsAt)));
        const hour = Number(bookingTime(draft.startsAt).split(":")[0]); setPeriod(hour < 12 ? 0 : hour < 17 ? 1 : 2);
      }
    }
  }, [ready, draft.startsAt]);
  const selectionKey = JSON.stringify(props.selection);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    postBooking<BookingAvailability>("availability", { ...props.selection, month }, controller.signal).then(result => {
      setData(result);
      setDate(current => result.days.some(d => d.date === current && d.slots.length) ? current : result.days.find(d => d.slots.length)?.date ?? `${month}-01`);
    }).catch(err => { if (err.name !== "AbortError") { setData(null); setError(err.message || "Nie udało się pobrać terminów."); setErrorStatus(err.status); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [month, selectionKey, revision]);
  const monthStart = new Date(`${month}-01T12:00:00Z`);
  const offset = (monthStart.getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
  const daySlots = data?.days.find(d => d.date === date)?.slots ?? [];
  const selectedSlot = daySlots.find(s => s.startsAt === draft.startsAt);
  const times = Array.from({ length: period === 0 ? 16 : period === 1 ? 20 : 12 }, (_, i) => {
    const min = (period === 0 ? 8 : period === 1 ? 12 : 17) * 60 + i * 15;
    return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  });
  const changeMonth = (delta: number) => {
    setMonth(new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + delta, 1)).toISOString().slice(0, 7));
    update({ startsAt: "" });
  };
  return <OrderProcessShell activeStep={1}>
    <div className="mx-auto grid min-w-0 w-full max-w-[1200px] gap-[20px] xl:grid-cols-[540px_540px] xl:justify-between" data-node-id="781:626">
      <section aria-label="Kalendarz terminów" aria-busy={loading} className="box-border min-w-0 w-full overflow-hidden rounded-[20px] bg-white p-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.04),0_4px_6px_-4px_rgba(0,0,0,0.1)] xl:w-[540px]">
        <header className="flex h-[48px] items-center justify-between border-b border-[#e5e7eb] px-[24px]">
          <button aria-label="Poprzedni miesiąc" disabled={month <= (data?.today ?? bookingDate()).slice(0, 7)} className="grid h-8 w-8 place-items-center rounded-lg text-[#2e3b4c] disabled:opacity-30" onClick={() => changeMonth(-1)} type="button"><ChevronLeft className="h-[14px] w-[14px]" strokeWidth={1.8} /></button>
          <h2 className="m-0 text-[14px] font-semibold capitalize leading-5 text-[#2e3b4c]">{new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthStart)}</h2>
          <button aria-label="Następny miesiąc" disabled={!data || month >= data.maxDate.slice(0, 7)} className="grid h-8 w-8 place-items-center rounded-lg text-[#2e3b4c] disabled:opacity-30" onClick={() => changeMonth(1)} type="button"><ChevronRight className="h-[14px] w-[14px]" strokeWidth={1.8} /></button>
        </header>
        <div className="grid grid-cols-7 px-[16px] py-[12px]">{["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map(day => <span className="text-center text-[12px] font-medium uppercase leading-4 text-[#6b7280]" key={day}>{day}</span>)}</div>
        <div className="grid h-[360px] grid-cols-7 grid-rows-6 overflow-hidden rounded-[10px] bg-[#f4f6f9]">
          {Array.from({ length: 42 }, (_, index) => {
            const day = index - offset + 1;
            const outside = day < 1 || day > dayCount;
            const cellDate = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day)).toISOString().slice(0, 10);
            const available = !outside && !!data?.days.find(d => d.date === cellDate)?.slots.length;
            const selected = !outside && date === cellDate;
            return <button aria-label={`${bookingDayLabel(cellDate)}${available ? ", dostępny" : ", niedostępny"}`} aria-pressed={selected} disabled={loading || !available} key={cellDate} onClick={() => { setDate(cellDate); update({ startsAt: "" }); }} type="button"
              className={["relative flex items-center justify-center border-b border-r border-[#e5e7eb] text-[14px] leading-5", index % 7 === 6 ? "border-r-0" : "", index >= 35 ? "border-b-0" : "", outside ? "text-[#d1d5db]" : "text-[#7c8691]", selected && available ? "m-[5px] rounded-[10px] border-0 bg-[#0079de] font-medium text-white" : ""].join(" ")}>
              {Number(cellDate.slice(-2))}
              {!outside && !selected && !loading ? <span className={`absolute bottom-[12px] h-px w-[16px] ${available ? "bg-[#36a269]" : "bg-[#d13239]"}`} /> : null}
            </button>;
          })}
        </div>
      </section>
      <section className="grid min-w-0 w-full content-start gap-[20px] xl:w-[540px]">
        <div className="box-border flex h-[71px] min-w-0 w-full items-center justify-between gap-2 rounded-[20px] border border-[#e5e7eb] bg-white p-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.04)]"><ProviderLine profile={props.profile} /><span className="shrink-0 rounded-[99px] bg-[#f0f2f4] px-[10px] py-1 text-[14px] text-[#7c8691]">{data?.quote.summary.duration ?? "…"}</span></div>
        <div className="box-border flex h-[51px] min-w-0 w-full items-center rounded-[30px] border border-[#e5e7eb] bg-[#f4f6f9] p-[7px] shadow-[0_4px_7px_rgba(0,0,0,0.04)]">
          {["Rano", "Południe", "Wieczór"].map((label, index) => <button aria-pressed={period === index} className={`h-[37px] flex-1 rounded-[30px] text-[14px] font-medium ${index === period ? "bg-white text-[#0079de] shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-[#2e3b4c]"}`} key={label} onClick={() => setPeriod(index)} type="button">{label}</button>)}
        </div>
        <div className="grid min-w-0 w-full grid-cols-4 gap-2">{times.map(time => {
          const slot = daySlots.find(s => s.time === time);
          const selected = slot?.startsAt === draft.startsAt;
          return <button aria-label={`Godzina ${time}`} aria-pressed={!!selected} disabled={loading || !slot || !ready} onClick={() => slot && update({ startsAt: slot.startsAt })} className={`h-[46px] rounded-[30px] border text-[14px] shadow-[0_1px_7px_rgba(0,0,0,0.04)] ${selected ? "border-[#0079de] bg-[#0079de] font-medium text-white" : !slot || loading ? "border-[#e5e7eb] bg-[#f4f6f9] text-[#9ca3af]" : "border-[#e5e7eb] bg-white text-[#2e3b4c]"}`} key={time} type="button">{time}</button>;
        })}</div>
        <p aria-live="polite" className="m-0 text-[13px] leading-5 text-[#7c8691]">{loading ? "Sprawdzamy dostępne terminy…" : selectedSlot ? `${bookingDayLabel(date)}, ${selectedSlot.time}–${bookingTime(selectedSlot.endsAt)}` : daySlots.length ? "Wybierz godzinę rozpoczęcia. Terminy w czasie polskim." : "Brak dostępnych terminów. Wybierz inny dzień lub miesiąc albo zmniejsz zakres usługi."}</p>
        <ErrorNotice message={error} status={errorStatus} backHref={`/zamowienie?${props.query}`} />
        {error ? <button type="button" className="text-[14px] text-[#0079de]" onClick={() => setRevision(v => v + 1)}>Spróbuj ponownie</button> : null}
        <button className="ml-auto h-[48px] w-full rounded-[30px] bg-[#0079de] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-[196px]" disabled={loading || !selectedSlot || !ready} onClick={() => { save(); router.push(`/zamowienie/podsumowanie?${props.query}`); }} type="button">Przejdź dalej</button>
      </section>
    </div>
  </OrderProcessShell>;
}

export function OrderDateScreen(props: BookingPageProps) {
  const isMultiSession = props.profile.tags.some((tag) => tag.toLocaleLowerCase("pl-PL") === "wielosesyjne");
  return isMultiSession ? <MultiSessionScheduleScreen {...props} /> : <SingleSessionOrderDateScreen {...props} />;
}

function SummarySection({ children, title, action }: { action?: () => void; children: ReactNode; title: string }) {
  return <section className="grid gap-[15px] rounded-[30px] border border-[#e6edf3] bg-white p-[30px] shadow-[0_0_14px_rgba(0,0,0,0.04)]"><header className="flex items-center justify-between px-0.5"><h2 className="m-0 text-[20px] font-medium leading-6 text-[#111827]">{title}</h2>{action ? <button className="border-0 bg-transparent p-0 text-[14px] font-medium text-[#0079de]" onClick={action} type="button">Edytuj</button> : null}</header>{children}</section>;
}
function FloatingField({ label, value, onChange, required = false, placeholder, maxLength = 350, type = "text", pattern }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; maxLength?: number; type?: string; pattern?: string }) {
  return <label className="relative flex h-[52px] min-w-0 flex-1 items-center justify-between rounded-[30px] border border-[#e5e7eb] bg-[#f9fafb] px-[20px] text-[14px] focus-within:border-[#0079de]">
    <span className="absolute left-[19px] top-[-13px] rounded-[10px] bg-gradient-to-t from-[#f9fafb] to-white px-1 py-0.5 text-[#2e3b4c]">{label}</span>
    <input className="min-w-0 w-full border-0 bg-transparent text-[#2e3b4c] outline-none placeholder:text-[#9ca3af]" aria-label={label} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} maxLength={maxLength} type={type} pattern={pattern} />
  </label>;
}

function MultiSessionOrderSummaryScreen(props: BookingPageProps) {
  const router = useRouter();
  const { draft, update, ready, save, key } = useDraft(props);
  const [sessions, setSessions] = useState<MultiSessionBookingSession[] | null>(null);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number>();
  const [submitting, setSubmitting] = useState(false);
  const addressRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const backHref = `/zamowienie?${props.query}`;
  const scheduleKey = multiSessionStorageKey(props);
  const selectionKey = JSON.stringify(props.selection);

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(scheduleKey) ?? "null");
      setSessions(isMultiSessionBookingState(stored) ? stored.sessions : null);
    } catch { setSessions(null); }
    setScheduleLoaded(true);
  }, [scheduleKey]);

  useEffect(() => {
    const controller = new AbortController();
    postBooking<BookingQuote>("quote", props.selection, controller.signal).then(setQuote).catch((err) => {
      if (err.name !== "AbortError") { setError(err.message); setErrorStatus(err.status); }
    });
    return () => controller.abort();
  }, [selectionKey]);

  const editSchedule = () => { save(); router.push(backHref); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current || !quote || !sessions?.length) return;
    const bookingSessions = sessions.map((session) => {
      const startsAt = multiSessionIso(session.date, session.start);
      const rawEndsAt = multiSessionIso(session.date, session.end);
      const endsAt = startsAt && rawEndsAt && Date.parse(rawEndsAt) <= Date.parse(startsAt)
        ? new Date(Date.parse(rawEndsAt) + 24 * 60 * 60_000).toISOString()
        : rawEndsAt;
      return { startsAt, endsAt, workers: session.workerCount };
    });
    if (bookingSessions.some((session) => !session.startsAt || !session.endsAt)) {
      setError("Harmonogram zawiera nieprawidłowy termin. Wróć do harmonogramu i wybierz go ponownie.");
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError("");
    setErrorStatus(undefined);
    save();
    try {
      const order = await postBooking<OrderCardData>("confirm", {
        ...props.selection,
        startsAt: bookingSessions[0].startsAt,
        sessions: bookingSessions,
        address: draft.address,
        apartment: draft.apartment,
        contactName: draft.contactName,
        contactPhone: draft.contactPhone,
        notes: draft.notes,
        requestId: draft.requestId,
        expectedTotal: quote.totalValue,
        invoice: draft.invoiceRequested ? { companyName: draft.companyName, taxId: draft.taxId, address: draft.invoiceAddress } : null
      });
      if (!order.id) throw new Error("Brak potwierdzenia zapisu. Spróbuj ponownie.");
      try {
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(scheduleKey);
      } catch { /* The server deduplicates retries. */ }
      router.replace(`/zamowienie/potwierdzenie?id=${encodeURIComponent(order.id)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać zamówienia.");
      setErrorStatus(err instanceof BookingError ? err.status : undefined);
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  if (!ready || !scheduleLoaded) return <OrderProcessShell activeStep={2}><p className="text-center text-[#7c8691]">Wczytywanie zamówienia…</p></OrderProcessShell>;
  if (!sessions?.length) return <OrderProcessShell activeStep={2}><div className="mx-auto max-w-[780px] rounded-[30px] bg-white p-[30px] text-[#2e3b4c]"><p>Najpierw wygeneruj harmonogram realizacji zamówienia.</p><Link className="mt-4 inline-block text-[#0079de]" href={backHref}>Przejdź do harmonogramu</Link></div></OrderProcessShell>;

  return <OrderProcessShell activeStep={2}>
    <form onSubmit={submit} className="mx-auto grid w-full max-w-[1200px] items-start gap-[20px] xl:grid-cols-[780px_400px]" data-node-id="4559:7318">
      <fieldset disabled={submitting} className="grid min-w-0 gap-[20px] border-0 p-0">
        <SummarySection title="Adres realizacji">
          <div className="grid gap-[20px] md:grid-cols-2">
            <FloatingField label="Numer mieszkania" value={draft.apartment} onChange={(apartment) => update({ apartment })} placeholder="Wpisz numer, jeśli dotyczy…" maxLength={30} />
            <div className="relative flex h-[52px] min-w-0 items-center justify-between gap-[10px] rounded-[30px] border border-[#e5e7eb] bg-[#f9fafb] px-[20px] text-[14px] focus-within:border-[#0079de]">
              <span className="absolute left-[19px] top-[-13px] rounded-[10px] bg-gradient-to-t from-[#f9fafb] to-white px-1 py-0.5 text-[#2e3b4c]">Adres</span>
              <input ref={addressRef} aria-label="Adres" className="min-w-0 flex-1 border-0 bg-transparent text-[#2e3b4c] outline-none" maxLength={350} onChange={(event) => update({ address: event.target.value })} required value={draft.address} />
              <button className="shrink-0 text-[14px] font-medium text-[#0079de]" onClick={() => addressRef.current?.focus()} type="button">Edytuj</button>
            </div>
          </div>
        </SummarySection>

        <SummarySection title="Termin realizacji" action={editSchedule}>
          <div className="grid gap-[8px]">
            {sessions.map((session, index) => {
              const date = multiSessionDateValue(session.date);
              return <div className="min-h-[57px] rounded-[15px] border border-[#e5e7eb] bg-[#f9fafb] px-[15px] py-[5px]" key={session.id}>
                <div className="grid min-h-[47px] items-center gap-[10px] text-[14px] text-[#2e3b4c] md:grid-cols-[154px_154px_minmax(0,1fr)]">
                  <span className="font-medium">Sesja {index + 1}</span>
                  <span>{date ? bookingDayLabel(date) : session.date}</span>
                  <span className="flex items-center justify-end gap-[5px]">
                    <span>{session.start}</span>
                    <span className="grid justify-items-center px-[9px] text-[12px] text-[#7c8691]">
                      {session.duration}
                      <img alt="" className="h-[16px] w-[16px]" src="/figma-assets/schedule-arrow-right.svg" />
                    </span>
                    <span>{session.end}</span>
                  </span>
                </div>
              </div>;
            })}
          </div>
        </SummarySection>

        <SummarySection title="Zamówienie">
          <div className="grid gap-[18px]">
            {quote ? quote.summary.lines.map((line) => <div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] px-0.5 pb-[8px] text-[14px] text-[#2e3b4c]" key={line.id}><span>{line.label}</span><span className="shrink-0 font-medium">{line.value}</span></div>) : <p className="text-[14px] text-[#7c8691]">Przeliczamy cenę…</p>}
          </div>
        </SummarySection>

        <SummarySection title="Uwagi do zamówienia">
          <textarea aria-label="Uwagi do zamówienia" className="h-[111px] w-full resize-none rounded-[15px] border border-[#e5e7eb] bg-white p-[15px] text-[14px] text-[#2e3b4c] outline-none placeholder:text-[#9ca3af] focus:border-[#0079de]" maxLength={2000} onChange={(event) => update({ notes: event.target.value })} placeholder="Wpisz jeżeli masz jakieś dodatkowe uwagi…" value={draft.notes} />
        </SummarySection>
      </fieldset>

      <aside className="grid gap-[20px]">
        <section className="grid gap-[20px] rounded-[30px] border border-[#e6edf3] bg-white p-[30px] shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          <ProviderLine profile={props.profile} size={53} />
          <div className="flex items-center justify-between rounded-[15px] border border-[#e5e7eb] p-[15px] text-[16px] font-bold text-[#2e3b4c]"><span>Suma</span><span>{quote?.summary.total ?? "…"}</span></div>
          <div className="rounded-[15px] bg-[#f4f6f9] p-[15px] text-[14px] leading-[22px] text-[#2e3b4c]"><strong>UWAGA!</strong><br />Rozliczenie odbywa się bezpośrednio z Wykonawcą (poza platformą), a szczegóły usługi możesz ustalić po złożeniu zamówienia.</div>
          <ErrorNotice message={error} status={errorStatus} backHref={`/zamowienie/podsumowanie?${props.query}`} />
          {errorStatus === 409 ? <button className="text-[14px] font-medium text-[#0079de]" onClick={editSchedule} type="button">Powrót do harmonogramu</button> : null}
          <button className="h-[48px] w-full rounded-[30px] bg-[#0079de] text-[14px] font-medium text-white disabled:opacity-40" disabled={!quote || submitting || !draft.address || !draft.contactName || !draft.contactPhone} type="submit">{submitting ? "Zapisywanie zamówienia…" : "Potwierdź i zamów"}</button>
        </section>

        <section className="rounded-[30px] border border-[#e6edf3] bg-white/60 p-[30px] text-[14px] leading-[22px] text-[#2e3b4c] shadow-[0_0_14px_rgba(0,0,0,0.04)]">
          <strong className="block pb-[3px]">ZGODY I INFORMACJE</strong>
          Finalizując zamówienie, akceptujesz <Link href="/regulaminy" target="_blank" rel="noreferrer" className="underline">Regulamin, Politykę prywatności</Link> oraz <Link href="/standardy-uslug" target="_blank" rel="noreferrer" className="underline">Standardy usług</Link> dla wybranego typu usługi. W związku z realizacją rezerwacji będziemy wysyłać Ci wiadomości SMS oraz e-mail z powiadomieniami dotyczącymi zarezerwowanej usługi.
        </section>
      </aside>
    </form>
  </OrderProcessShell>;
}

function SingleSessionOrderSummaryScreen(props: BookingPageProps) {
  const router = useRouter();
  const { draft, update, ready, save, key } = useDraft(props);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number>();
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const inFlight = useRef(false);
  const backHref = `/zamowienie?${props.query}`;
  const selectionKey = JSON.stringify(props.selection);
  useEffect(() => {
    const controller = new AbortController();
    postBooking<BookingQuote>("quote", props.selection, controller.signal).then(setQuote).catch(err => {
      if (err.name !== "AbortError") { setError(err.message); setErrorStatus(err.status); }
    });
    return () => controller.abort();
  }, [selectionKey]);
  const validStart = !!draft.startsAt && Number.isFinite(Date.parse(draft.startsAt));
  const editDate = () => { save(); router.push(backHref); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current || !quote || !accepted || !validStart) return;
    inFlight.current = true; setSubmitting(true); setError(""); setErrorStatus(undefined); save();
    try {
      const order = await postBooking<OrderCardData>("confirm", { ...props.selection, startsAt: draft.startsAt, address: draft.address, apartment: draft.apartment,
        contactName: draft.contactName, contactPhone: draft.contactPhone, notes: draft.notes, requestId: draft.requestId, expectedTotal: quote.totalValue,
        invoice: draft.invoiceRequested ? { companyName: draft.companyName, taxId: draft.taxId, address: draft.invoiceAddress } : null });
      if (!order.id) throw new Error("Brak potwierdzenia zapisu. Spróbuj ponownie.");
      try { sessionStorage.removeItem(key); } catch { /* The server deduplicates retries. */ }
      router.replace(`/zamowienie/potwierdzenie?id=${encodeURIComponent(order.id)}`); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać zamówienia."); setErrorStatus(err instanceof BookingError ? err.status : undefined);
      inFlight.current = false; setSubmitting(false);
    }
  };
  if (!ready) return <OrderProcessShell activeStep={2}><p className="text-center text-[#7c8691]">Wczytywanie zamówienia…</p></OrderProcessShell>;
  if (!validStart) return <OrderProcessShell activeStep={2}><div className="mx-auto max-w-[780px] rounded-[30px] bg-white p-[30px] text-[#2e3b4c]"><p>Najpierw wybierz termin realizacji zamówienia.</p><Link className="mt-4 inline-block text-[#0079de]" href={backHref}>Przejdź do kalendarza</Link></div></OrderProcessShell>;
  const endsAt = quote ? new Date(Date.parse(draft.startsAt) + quote.durationMinutes * 60_000).toISOString() : draft.startsAt;
  return <OrderProcessShell activeStep={2}>
    <form onSubmit={submit} className="mx-auto grid w-full max-w-[1200px] items-start gap-[20px] xl:grid-cols-[780px_400px]" data-node-id="1079:1322">
      <fieldset disabled={submitting} className="grid min-w-0 gap-[20px] border-0 p-0">
        <SummarySection title="Adres realizacji"><div className="grid gap-[20px] md:grid-cols-2">
          <FloatingField label="Numer mieszkania" value={draft.apartment} onChange={apartment => update({ apartment })} placeholder="Wpisz numer, jeśli dotyczy…" maxLength={30} />
          <FloatingField label="Adres" value={draft.address} onChange={address => update({ address })} placeholder="Ulica i numer, kod pocztowy, miasto" required />
        </div></SummarySection>
        <SummarySection title="Termin realizacji" action={editDate}>
          <div className="flex min-h-[63px] flex-wrap items-center justify-between gap-4 rounded-[15px] border border-[#e5e7eb] bg-[#f9fafb] px-[15px] py-2 text-[14px] text-[#2e3b4c]"><span>{bookingDayLabel(draft.startsAt)}</span><div className="flex items-center gap-[5px]"><span>{bookingTime(draft.startsAt)}</span><span className="grid justify-items-center px-[9px] text-[12px] text-[#7c8691]">{quote?.summary.duration ?? "…"}<ArrowRight className="h-4 w-4" strokeWidth={1.8} /></span><span>{bookingTime(endsAt)}</span></div></div>
          {quote && <p className="m-0 text-[13px] text-[#7c8691]">{quote.frequencyLabel}. Rezerwujesz jeden termin; kolejne wizyty wymagają osobnego zamówienia.</p>}
        </SummarySection>
        <SummarySection title="Zamówienie"><div className="grid gap-[18px]">{quote ? quote.summary.lines.map(line => <div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] px-0.5 pb-[8px] text-[14px] text-[#2e3b4c]" key={line.id}><span>{line.label}</span><span className="shrink-0 font-medium">{line.value}</span></div>) : <p className="text-[14px] text-[#7c8691]">Przeliczamy cenę…</p>}</div></SummarySection>
        <SummarySection title="Dane kontaktowe"><div className="grid gap-[20px] md:grid-cols-2">
          <FloatingField label="Imię i nazwisko" value={draft.contactName} onChange={contactName => update({ contactName })} required maxLength={150} />
          <FloatingField label="Numer telefonu" value={draft.contactPhone} onChange={contactPhone => update({ contactPhone })} required type="tel" maxLength={30} />
        </div>
          <label className="flex items-center gap-2 text-[14px] text-[#2e3b4c]"><input className="accent-[#0079de]" type="checkbox" checked={draft.invoiceRequested} onChange={e => update({ invoiceRequested: e.target.checked })} />Chcę otrzymać fakturę od wykonawcy</label>
          {draft.invoiceRequested ? <div className="mt-2 grid gap-[20px]"><FloatingField label="Nazwa firmy" value={draft.companyName} onChange={companyName => update({ companyName })} required maxLength={200} /><FloatingField label="NIP" value={draft.taxId} onChange={taxId => update({ taxId })} required maxLength={20} /><FloatingField label="Adres firmy" value={draft.invoiceAddress} onChange={invoiceAddress => update({ invoiceAddress })} required /></div> : null}
        </SummarySection>
        <SummarySection title="Uwagi do zamówienia"><textarea aria-label="Uwagi do zamówienia" className="h-[111px] w-full resize-y rounded-[15px] border border-[#e5e7eb] bg-white p-[15px] text-[14px] text-[#2e3b4c] outline-none placeholder:text-[#9ca3af] focus:border-[#0079de]" placeholder="Wpisz jeżeli masz jakieś dodatkowe uwagi…" value={draft.notes} onChange={e => update({ notes: e.target.value })} maxLength={2000} /></SummarySection>
      </fieldset>
      <aside className="grid gap-[20px]">
        <section className="grid gap-[20px] rounded-[30px] border border-[#e6edf3] bg-white p-[30px] shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          <ProviderLine profile={props.profile} size={53} />
          <div className="flex items-center justify-between rounded-[15px] border border-[#e5e7eb] p-[15px] text-[16px] font-bold text-[#2e3b4c]"><span>Suma</span><span>{quote?.summary.total ?? "…"}</span></div>
          <div className="rounded-[15px] bg-[#f4f6f9] p-[15px] text-[14px] leading-[22px] text-[#2e3b4c]"><strong>UWAGA!</strong><br />Rozliczenie odbywa się bezpośrednio z Wykonawcą (poza platformą), a szczegóły usługi możesz ustalić po złożeniu zamówienia.</div>
          <label className="flex items-start gap-2 text-[13px] leading-5 text-[#2e3b4c]"><input type="checkbox" className="mt-1 accent-[#0079de]" checked={accepted} disabled={submitting} onChange={e => setAccepted(e.target.checked)} required />Potwierdzam dane i akceptuję warunki realizacji usługi.</label>
          <ErrorNotice message={error} status={errorStatus} backHref={`/zamowienie/podsumowanie?${props.query}`} />
          {errorStatus === 409 ? <button className="text-[14px] font-medium text-[#0079de]" type="button" onClick={editDate}>Powrót do kalendarza</button> : null}
          <button className="h-[48px] w-full rounded-[30px] bg-[#0079de] text-[14px] font-medium text-white disabled:opacity-40" disabled={!quote || submitting || !accepted} type="submit">{submitting ? "Zapisywanie zamówienia…" : "Potwierdź i zamów"}</button>
        </section>
        <section className="rounded-[30px] border border-[#e6edf3] bg-white/60 p-[30px] text-[14px] leading-[22px] text-[#2e3b4c] shadow-[0_0_14px_rgba(0,0,0,0.04)]">Finalizując zamówienie, akceptujesz <Link href="/regulaminy" target="_blank" rel="noreferrer" className="underline">Regulamin i Politykę prywatności</Link> oraz <Link href="/standardy-uslug" target="_blank" rel="noreferrer" className="underline">Standardy usług</Link> dla wybranego typu usługi. Status rezerwacji sprawdzisz w panelu „Moje konto”.</section>
      </aside>
    </form>
  </OrderProcessShell>;
}

export function OrderSummaryScreen(props: BookingPageProps) {
  const isMultiSession = props.profile.tags.some((tag) => tag.toLocaleLowerCase("pl-PL") === "wielosesyjne");
  return isMultiSession ? <MultiSessionOrderSummaryScreen {...props} /> : <SingleSessionOrderSummaryScreen {...props} />;
}

export function OrderConfirmationScreen({ order }: { order: OrderCardData }) {
  const items = [{ icon: Mail, text: <>Dane zamówienia<br />zapisane w szczegółach</> }, { icon: CalendarCheck, text: <>Zamówienie zapisane<br />w panelu „Moje konto”</> }, { icon: Smartphone, text: <>Rozliczenie bezpośrednio<br />z Wykonawcą</> }];
  return <><OrderHeader /><main className="relative z-10 mx-auto box-border w-full max-w-[1200px] px-4 pb-[60px] pt-[80px] md:px-0" data-node-id="5303:10099">
    <section className="flex min-h-[831px] w-full flex-col items-center gap-[40px] rounded-[30px] bg-[radial-gradient(ellipse_at_center,#ffffff_0%,rgba(255,255,255,0.86)_52%,rgba(255,255,255,0)_100%)] px-4 py-[100px]">
      <div className="grid justify-items-center gap-[25px] text-center"><div className="relative grid h-[154px] w-[250px] place-items-center"><span className="absolute h-[130px] w-[130px] rotate-[-12deg] rounded-[42%_58%_56%_44%/52%_43%_57%_48%] border border-[#d8efff] bg-[radial-gradient(circle_at_55%_45%,#ffffff_0%,#f3fbff_55%,#dff4ff_100%)] shadow-[inset_0_0_28px_rgba(0,121,222,0.08)]" /><Check className="relative h-[64px] w-[64px] text-[#66c7ff] drop-shadow-[0_8px_12px_rgba(0,121,222,0.18)]" strokeWidth={5} /></div>
        <div><h1 className="m-0 text-[24px] font-semibold leading-[34px] text-[#111827]">Zamówienie potwierdzone</h1><p className="m-0 mt-[15px] max-w-[650px] text-[14px] leading-5 text-[#111827]">{order.provider} · {order.dateLines.join(" · ")}<br />Wykonawca może się z Tobą kontaktować w celu ustalenia szczegółów zlecenia.</p><Link className="mt-3 inline-block text-[14px] text-[#0079de]" href={`/zamowienia/szczegoly?id=${order.id}`}>Szczegóły zamówienia · {order.summary?.total}</Link></div>
      </div>
      <Link className="flex h-[52px] w-[300px] items-center justify-center rounded-[99px] bg-[#0079de] text-[14px] font-medium text-white" href="/zamowienia">Gotowe</Link>
      <div className="grid w-full max-w-[800px] gap-5 md:grid-cols-[1fr_1px_1fr_1px_1fr] md:items-center">{items.map(({ icon: Icon, text }, index) => <div className="contents" key={index}><div className="flex items-center gap-[15px]"><span className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-[#bce0ff] text-[#0079de]"><Icon className="h-4 w-4" strokeWidth={1.8} /></span><p className="m-0 text-[14px] font-medium leading-5 text-[#2e3b4c]">{text}</p></div>{index < items.length - 1 ? <span className="hidden h-[54px] w-px bg-[#dce0e3] md:block" /> : null}</div>)}</div>
    </section>
  </main></>;
}
