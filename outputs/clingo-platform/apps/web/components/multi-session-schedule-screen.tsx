"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { BookingError, bookingDate, postBooking, type BookingPageProps, type BookingQuote, type BookingSlot } from "../lib/booking-client";
import { isMultiSessionBookingState, multiSessionDateValue, multiSessionIso, multiSessionStorageKey, type MultiSessionBookingSession as Session } from "../lib/multi-session-booking";
import { OrderHeader } from "./order-header";
import { OrderSteps } from "./order-steps";
import { ScheduleSessionCard } from "./schedule-session-card";

import { PreviewCalendar, TimePicker, type Period } from "./schedule-date-time-picker";
type ScheduleState = "empty" | "loading" | "ready";
type EditTarget = { index: number; field: "day" | "time" } | null;
type MultiAvailability = {
  quote: BookingQuote;
  durationMinutes: number;
  days: Array<{ date: string; slots: BookingSlot[] }>;
  today: string;
  maxDate: string;
};
type GeneratedSchedule = {
  quote: BookingQuote;
  sessions: Array<{ id: number; startsAt: string; endsAt: string; durationMinutes: number; duration: string; workers: number }>;
};

const availabilityDays = [
  { id: "mon", label: "PON" },
  { id: "tue", label: "WT" },
  { id: "wed", label: "ŚR" },
  { id: "thu", label: "CZW" },
  { id: "fri", label: "PT" },
  { id: "sat", label: "SB" },
  { id: "sun", label: "ND" }
] as const;

const availabilityWeekdays: Record<(typeof availabilityDays)[number]["id"], number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function sessionDurationMinutes(session: Session) {
  return (timeToMinutes(session.end) - timeToMinutes(session.start) + 24 * 60) % (24 * 60) || 24 * 60;
}

function retitleSessions(sessions: Session[]) {
  const sorted = [...sessions].sort((first, second) => Date.parse(multiSessionIso(first.date, first.start)) - Date.parse(multiSessionIso(second.date, second.start)));
  return sorted.map((session, index) => ({
    ...session,
    title: index === 0 ? "Sesja 1 (start)" : index === sorted.length - 1 ? `Sesja ${index + 1} (koniec)` : `Sesja ${index + 1}`
  }));
}

function scheduleDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function scheduleTime(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function generatedSessions(result: GeneratedSchedule): Session[] {
  return result.sessions.map((session, index, all) => ({
    id: session.id,
    title: index === 0 ? "Sesja 1 (start)" : index === all.length - 1 ? `Sesja ${index + 1} (koniec)` : `Sesja ${index + 1}`,
    date: scheduleDate(session.startsAt),
    duration: session.duration.replace(" godz.", "h").replace(" min", "min"),
    workers: `${session.workers} ${session.workers === 1 ? "pracownik" : session.workers < 5 ? "pracowników" : "pracowników"}`,
    workerCount: session.workers,
    start: scheduleTime(session.startsAt),
    end: scheduleTime(session.endsAt)
  }));
}

function AvailabilityPopover({
  availableDays,
  changedDays,
  start,
  end,
  onDayToggle,
  onStartChange,
  onEndChange,
  onSave
}: {
  availableDays: Set<string>;
  changedDays: Set<string>;
  start: string;
  end: string;
  onDayToggle: (day: string) => void;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
  onSave: () => void;
}) {
  const validRange = timeToMinutes(start) < timeToMinutes(end);

  return (
    <section
      aria-label="Ustawienia dostępności"
      className="absolute right-0 top-[52px] z-50 grid w-[calc(100vw-32px)] max-w-[535px] gap-[30px] rounded-[30px] bg-white p-[20px] shadow-[0_4px_7px_rgba(0,0,0,0.08)] sm:right-[-35px] sm:p-[30px]"
      id="schedule-availability"
    >
      <div className="grid gap-[15px]">
        <h2 className="m-0 text-[14px] font-medium leading-normal text-[#2e3b4c]">Wybierz dostępne dni tygodnia</h2>
        <div className="grid grid-cols-7 gap-[10px]">
          {availabilityDays.map((day) => {
            const enabled = availableDays.has(day.id);
            const unavailableStyle = changedDays.has(day.id) ? "text-[#2e3b4c]" : "text-[#7c8691]";
            return (
              <button
                aria-pressed={enabled}
                className={`flex h-[58px] min-w-0 flex-col items-center justify-center gap-[5px] rounded-[15px] border border-[#e5e7eb] text-[12px] font-medium ${enabled ? "bg-[#f4f6f9] text-[#2e3b4c]" : `bg-white ${unavailableStyle}`}`}
                key={day.id}
                onClick={() => onDayToggle(day.id)}
                type="button"
              >
                {day.label}
                <span className={`h-[3px] w-[29px] max-w-[72%] rounded-full ${enabled ? "bg-[#34a853]" : changedDays.has(day.id) ? "bg-[#d13239]" : "bg-[#ced4da]"}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-[15px]">
        <h2 className="m-0 text-[14px] font-medium leading-normal text-[#2e3b4c]">Wybierz dostępne godziny</h2>
        <div className="flex items-center gap-[15px]">
          <label className="flex h-[47px] w-[128px] items-center justify-between gap-[10px] rounded-[10px] border border-[#e5e7eb] px-[20px]">
            <span className="sr-only">Dostępność od</span>
            <input
              aria-label="Dostępność od"
              className="min-w-0 w-full appearance-none border-0 bg-transparent text-[14px] text-[#2e3b4c] outline-none [&::-webkit-calendar-picker-indicator]:hidden"
              onChange={(event) => onStartChange(event.target.value)}
              type="time"
              value={start}
            />
            <img alt="" className="h-[14px] w-[14px] shrink-0" src="/figma-assets/schedule-clock.svg" />
          </label>
          <span aria-hidden="true" className="h-[2px] w-[15px] shrink-0 rounded-full bg-[#2e3b4c]" />
          <label className="flex h-[47px] w-[128px] items-center justify-between gap-[10px] rounded-[10px] border border-[#e5e7eb] px-[20px]">
            <span className="sr-only">Dostępność do</span>
            <input
              aria-label="Dostępność do"
              className="min-w-0 w-full appearance-none border-0 bg-transparent text-[14px] text-[#2e3b4c] outline-none [&::-webkit-calendar-picker-indicator]:hidden"
              onChange={(event) => onEndChange(event.target.value)}
              type="time"
              value={end}
            />
            <img alt="" className="h-[14px] w-[14px] shrink-0" src="/figma-assets/schedule-clock.svg" />
          </label>
        </div>
      </div>

      <button
        className="h-[42px] w-[125px] rounded-[30px] bg-[#0079de] px-[40px] text-[14px] font-medium text-white disabled:opacity-40"
        disabled={!validRange}
        onClick={onSave}
        type="button"
      >
        Zapisz
      </button>
    </section>
  );
}

function ScheduleToolbar({
  scheduleState,
  availabilityOpen,
  availableDays,
  changedDays,
  availabilityStart,
  availabilityEnd,
  onBack,
  onRefresh,
  onContinue,
  onAvailabilityToggle,
  onDayToggle,
  onStartChange,
  onEndChange,
  onAvailabilitySave
}: {
  scheduleState: ScheduleState;
  availabilityOpen: boolean;
  availableDays: Set<string>;
  changedDays: Set<string>;
  availabilityStart: string;
  availabilityEnd: string;
  onBack: () => void;
  onRefresh: () => void;
  onContinue: () => void;
  onAvailabilityToggle: () => void;
  onDayToggle: (day: string) => void;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
  onAvailabilitySave: () => void;
}) {
  return (
    <div className="relative flex flex-wrap items-center justify-end gap-[15px]">
      <button aria-label="Cofnij" className="grid h-[42px] w-[42px] place-items-center rounded-[30px] border border-[#ced4da] bg-[#f4f6f9]" onClick={onBack} type="button">
        <img alt="" className="h-[12px] w-[16px]" src="/figma-assets/schedule-back.svg" />
      </button>
      <button aria-label="Odśwież harmonogram" className="grid h-[42px] w-[42px] place-items-center rounded-[30px] border border-[#ced4da] bg-[#f4f6f9] disabled:opacity-40" disabled={scheduleState === "empty"} onClick={onRefresh} type="button">
        <img alt="" className="h-[14px] w-[14px]" src="/figma-assets/schedule-refresh.svg" />
      </button>
      <button
        aria-controls="schedule-availability"
        aria-expanded={availabilityOpen}
        className={`flex h-[42px] w-[185px] items-center justify-center gap-[10px] rounded-[100px] border border-[#ced4da] px-[20px] text-[14px] text-[#2e3b4c] ${availabilityOpen ? "bg-[#e5e7eb]" : "bg-[#f4f6f9]"}`}
        onClick={onAvailabilityToggle}
        type="button"
      >
        Twoja dostępność
        <img alt="" className={`h-[14px] w-[14px] transition-transform ${availabilityOpen ? "rotate-180" : ""}`} src="/figma-assets/schedule-angle-down.svg" />
      </button>
      <button
        className={`h-[42px] w-[180px] rounded-[30px] border text-[14px] font-medium leading-[22px] ${scheduleState === "ready" ? "border-[#0079de] bg-[#0079de] text-white" : "border-[#ced4da] bg-[#e5e7eb] text-[#b2bac3]"}`}
        disabled={scheduleState !== "ready"}
        onClick={onContinue}
        type="button"
      >
        Przejdź dalej
      </button>

      {availabilityOpen ? (
        <AvailabilityPopover
          availableDays={availableDays}
          changedDays={changedDays}
          end={availabilityEnd}
          onDayToggle={onDayToggle}
          onEndChange={onEndChange}
          onSave={onAvailabilitySave}
          onStartChange={onStartChange}
          start={availabilityStart}
        />
      ) : null}
    </div>
  );
}

function ScheduleTile({ session, index, editing, onEdit }: { session: Session; index: number; editing: EditTarget; onEdit: (index: number, field: "day" | "time") => void }) {
  const editingDay = editing?.index === index && editing.field === "day";
  const editingTime = editing?.index === index && editing.field === "time";

  return (
    <ScheduleSessionCard title={session.title} duration={session.duration} workers={session.workers} start={session.start} end={session.end} actions={
      <div className="flex h-[38px] shrink-0 items-center gap-[10px]">
        <button
          aria-pressed={editingDay}
          className={`h-[38px] rounded-[30px] border border-[#e5e7eb] px-[15px] text-[13px] text-[#7c8691] ${editingDay ? "bg-[#f0f2f4]" : "bg-white"}`}
          onClick={() => onEdit(index, "day")}
          type="button"
        >
          Zmień dzień
        </button>
        <span aria-hidden="true" className="h-[24px] w-px bg-[#e5e7eb]" />
        <button
          aria-pressed={editingTime}
          className={`h-[38px] rounded-[30px] border border-[#bfdbfe] px-[15px] text-[13px] text-[#0079de] ${editingTime ? "bg-[#e9f3ff]" : "bg-white"}`}
          onClick={() => onEdit(index, "time")}
          type="button"
        >
          Zmień godziny
        </button>
      </div>
    } />
  );
}

function ScheduleBoard({ sessions, editing, onEdit }: { sessions: Session[]; editing: EditTarget; onEdit: (index: number, field: "day" | "time") => void }) {
  return (
    <div className="relative grid gap-[51px]" aria-label="Wygenerowane sesje">
      <span aria-hidden="true" className="absolute bottom-[30px] left-[91px] top-[19px] w-[2px] bg-[#e5e7eb]" />
      {sessions.map((session, index) => (
        <div className="relative grid min-w-0 grid-cols-[72px_20px_minmax(0,1fr)] gap-[10px]" key={session.id}>
          <div className="relative mt-[15px] h-[40px]">
            {session.newSession ? (
              <span className="absolute -top-[15px] left-0 z-0 whitespace-nowrap rounded-t-[8px] bg-[#dbeafe] px-[6px] pb-[18px] pt-[4px] text-[12px] font-medium leading-normal text-[#0079de]">
                Nowa sesja
              </span>
            ) : null}
            <span className="relative z-10 flex h-[40px] items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white text-[13px] text-[#7c8691]">{session.date}</span>
          </div>
          <span className="relative z-10 flex justify-center pt-[15px]">
            <img alt="" className="h-[16px] w-[16px]" src="/figma-assets/schedule-timeline-dot.svg" />
          </span>
          <ScheduleTile editing={editing} index={index} onEdit={onEdit} session={session} />
        </div>
      ))}
    </div>
  );
}

export function MultiSessionScheduleScreen(props: BookingPageProps) {
  const router = useRouter();
  const storageKey = multiSessionStorageKey(props);
  const selectionKey = JSON.stringify(props.selection);
  const [period, setPeriod] = useState<Period>("Rano");
  const [month, setMonth] = useState(() => bookingDate().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(() => bookingDate());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduleState, setScheduleState] = useState<ScheduleState>("empty");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availableDays, setAvailableDays] = useState<Set<string>>(() => new Set(["mon", "tue", "wed", "thu", "fri", "sat"]));
  const [changedDays, setChangedDays] = useState<Set<string>>(() => new Set());
  const [availabilityStart, setAvailabilityStart] = useState("08:00");
  const [availabilityEnd, setAvailabilityEnd] = useState("20:00");
  const [availabilityRevision, setAvailabilityRevision] = useState(0);
  const [availability, setAvailability] = useState<MultiAvailability | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number>();

  const availabilityInput = useMemo(() => ({
    days: [...availableDays].map(day => availabilityWeekdays[day as keyof typeof availabilityWeekdays]),
    start: availabilityStart,
    end: availabilityEnd
  }), [availabilityEnd, availabilityStart, availableDays]);

  const editingDuration = editing ? sessionDurationMinutes(sessions[editing.index]) : undefined;
  const selectedSlots = availability?.days.find(day => day.date === selectedDate)?.slots ?? [];

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
      if (!isMultiSessionBookingState(stored)) return;
      setSelectedDate(stored.selectedDate);
      setMonth(stored.selectedDate.slice(0, 7));
      setSelectedTime(stored.selectedTime);
      setSessions(stored.sessions);
      setScheduleState("ready");
    } catch { /* Start with an empty schedule when browser storage is unavailable. */ }
  }, [storageKey]);

  useEffect(() => {
    const controller = new AbortController();
    setCalendarLoading(true);
    setError("");
    postBooking<MultiAvailability>("multi-availability", {
      ...props.selection,
      month,
      durationMinutes: editingDuration,
      availability: availabilityInput
    }, controller.signal).then(result => {
      setAvailability(result);
      setSelectedDate(current => result.days.some(day => day.date === current && day.slots.length)
        ? current : result.days.find(day => day.slots.length)?.date ?? `${month}-01`);
    }).catch(reason => {
      if (reason.name === "AbortError") return;
      setAvailability(null);
      setError(reason instanceof Error ? reason.message : "Nie udało się pobrać dostępnych terminów.");
      setErrorStatus(reason instanceof BookingError ? reason.status : undefined);
    }).finally(() => {
      if (!controller.signal.aborted) setCalendarLoading(false);
    });
    return () => controller.abort();
  }, [availabilityRevision, editingDuration, month, selectionKey]);

  const generateSchedule = async (startsAt: string) => {
    setScheduleState("loading");
    setEditing(null);
    setError("");
    setErrorStatus(undefined);
    try {
      const result = await postBooking<GeneratedSchedule>("multi-schedule", { ...props.selection, startsAt, availability: availabilityInput });
      const nextSessions = generatedSessions(result);
      setSessions(nextSessions);
      setSelectedDate(bookingDate(new Date(startsAt)));
      setSelectedTime(scheduleTime(startsAt));
      setScheduleState("ready");
    } catch (reason) {
      setSessions([]);
      setScheduleState("empty");
      setError(reason instanceof Error ? reason.message : "Nie udało się wygenerować harmonogramu.");
      setErrorStatus(reason instanceof BookingError ? reason.status : undefined);
      setAvailabilityRevision(value => value + 1);
    }
  };

  const updateEditedSession = (slot: BookingSlot) => {
    if (!editing) return;
    const targetIndex = editing.index;
    setSessions(current => retitleSessions(current.map((session, index) => index === targetIndex ? {
      ...session,
      date: scheduleDate(slot.startsAt),
      start: scheduleTime(slot.startsAt),
      end: scheduleTime(slot.endsAt),
      newSession: editing.field === "day" || session.newSession
    } : session)));
    setSelectedDate(slot.startsAt.slice(0, 10));
    setSelectedTime(slot.time);
    setEditing(null);
    setAvailabilityRevision(value => value + 1);
  };

  const handleTimeSelect = (slot: BookingSlot) => {
    if (editing) {
      updateEditedSession(slot);
      return;
    }
    setSelectedTime(slot.time);
    void generateSchedule(slot.startsAt);
  };

  const handleDaySelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (editing?.field === "day") {
      const slots = availability?.days.find(day => day.date === date)?.slots ?? [];
      const previousTime = sessions[editing.index]?.start;
      const slot = slots.find(candidate => candidate.time === previousTime) ?? slots[0];
      if (slot) updateEditedSession(slot);
    }
  };

  const handleEdit = (index: number, field: "day" | "time") => {
    const next = editing?.index === index && editing.field === field ? null : { index, field };
    setEditing(next);
    if (!next) {
      setAvailabilityRevision(value => value + 1);
      return;
    }
    const session = sessions[index];
    const date = multiSessionDateValue(session.date);
    if (date) {
      setSelectedDate(date);
      setMonth(date.slice(0, 7));
    }
    setSelectedTime(session.start);
    const hour = timeToMinutes(session.start);
    setPeriod(hour < 12 * 60 ? "Rano" : hour < 17 * 60 ? "Południe" : "Wieczór");
  };

  const resetSchedule = () => {
    try { sessionStorage.removeItem(storageKey); } catch { /* The visible reset still works. */ }
    setSelectedTime(null);
    setSessions([]);
    setScheduleState("empty");
    setEditing(null);
    setError("");
    setAvailabilityRevision(value => value + 1);
  };

  const refreshSchedule = () => {
    const first = sessions[0];
    const startsAt = first ? multiSessionIso(first.date, first.start) : "";
    if (startsAt) void generateSchedule(startsAt);
  };

  const changeMonth = (delta: number) => {
    const current = new Date(`${month}-01T12:00:00Z`);
    current.setUTCMonth(current.getUTCMonth() + delta);
    setMonth(current.toISOString().slice(0, 7));
    setSelectedTime(null);
  };

  const toggleAvailabilityDay = (day: string) => {
    setAvailableDays((current) => {
      const next = new Set(current);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
    setChangedDays((current) => new Set(current).add(day));
  };

  const saveAvailability = () => {
    setAvailabilityOpen(false);
    setAvailabilityRevision(value => value + 1);
    const first = sessions[0];
    const startsAt = first ? multiSessionIso(first.date, first.start) : "";
    if (startsAt) {
      void generateSchedule(startsAt);
    } else if (selectedTime) {
      setSelectedTime(null);
    }
  };

  const continueToSummary = () => {
    if (scheduleState !== "ready" || !selectedTime) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ selectedDate, selectedTime, sessions }));
    } catch { /* Navigation still allows the summary to show its recovery state. */ }
    router.push(`/zamowienie/podsumowanie?${props.query}`);
  };

  const retryAvailability = () => {
    setError("");
    setErrorStatus(undefined);
    setAvailabilityRevision(value => value + 1);
  };

  return (
    <>
      <OrderHeader />
      <main className="relative z-10 mx-auto box-border w-full max-w-[1440px] px-4 pb-[60px] pt-[80px] md:px-0" data-name="Panel generowania harmonogramu - wielosesyjne" data-node-id="4519:6906">
        <div className="grid min-h-[831px] w-full items-start gap-[30px] xl:grid-cols-[400px_minmax(0,1fr)]">
          <aside className="grid w-full gap-[30px] rounded-[30px] border border-[#e5e7eb] bg-white px-[25px] pb-[25px] pt-[10px] shadow-[0_4px_7px_rgba(0,0,0,0.04)] xl:w-[400px]">
            <PreviewCalendar availability={availability} loading={calendarLoading} month={month} onMonthChange={changeMonth} onSelect={handleDaySelect} selectedDate={selectedDate} />
            <TimePicker
              availabilityEnd={availabilityEnd}
              availabilityStart={availabilityStart}
              loading={calendarLoading}
              onPeriodChange={setPeriod}
              onTimeSelect={handleTimeSelect}
              period={period}
              selectedTime={selectedTime}
              slots={selectedSlots}
            />
          </aside>

          <section className="grid min-w-0 gap-[20px]">
            <OrderSteps activeStep={1} mode="multi-session" />
            <section className="flex min-h-[698px] w-full flex-col rounded-[30px] border border-[#e5e7eb] bg-white/40 p-[30px] shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
              <header className="relative z-20 flex flex-wrap items-start justify-between gap-5">
                <div className="grid gap-[5px]">
                  <h1 className="m-0 text-[24px] font-semibold leading-normal text-[#2e3b4c]">Twój harmonogram</h1>
                  <p className="m-0 text-[14px] leading-normal text-[#7c8691]">Wygenerowany automatycznie według dostępności wykonawcy.</p>
                </div>
                <ScheduleToolbar
                  availabilityEnd={availabilityEnd}
                  availabilityOpen={availabilityOpen}
                  availabilityStart={availabilityStart}
                  availableDays={availableDays}
                  changedDays={changedDays}
                  onAvailabilitySave={saveAvailability}
                  onAvailabilityToggle={() => setAvailabilityOpen((open) => !open)}
                  onBack={resetSchedule}
                  onContinue={continueToSummary}
                  onDayToggle={toggleAvailabilityDay}
                  onEndChange={setAvailabilityEnd}
                  onRefresh={refreshSchedule}
                  onStartChange={setAvailabilityStart}
                  scheduleState={scheduleState}
                />
              </header>

              {error ? (
                <div className="mt-[20px] flex items-center justify-between gap-4 rounded-[15px] border border-[#f4c7ca] bg-[#fff5f5] p-[15px] text-[14px] text-[#b52a35]" role="alert">
                  <span>{error}</span>
                  {errorStatus !== 401 ? <button className="shrink-0 font-medium underline" onClick={retryAvailability} type="button">Spróbuj ponownie</button> : null}
                </div>
              ) : null}

              {scheduleState === "empty" ? (
                <div className="flex flex-1 items-center justify-center py-[40px] text-center">
                  <div className="grid justify-items-center gap-[15px] text-[#7c8691]">
                    <img alt="" className="h-[30px] w-[30px]" src="/figma-assets/schedule-choose.svg" />
                    <div className="grid gap-[5px]">
                      <p className="m-0 text-[20px] font-medium leading-normal">Wybierz datę i godzinę,</p>
                      <p className="m-0 text-[16px] leading-normal">aby wygenerować harmonogram.</p>
                    </div>
                  </div>
                </div>
              ) : scheduleState === "loading" ? (
                <div aria-live="polite" className="flex flex-1 items-center justify-center py-[40px]">
                  <img alt="Generowanie harmonogramu" className="h-[100px] w-[100px] object-contain" src="/figma-assets/schedule-loading.png" />
                </div>
              ) : (
                <div className="mt-[30px] min-w-0 flex-1 overflow-x-auto pr-[2px]">
                  <div className="min-w-[720px]">
                    <ScheduleBoard editing={editing} onEdit={handleEdit} sessions={sessions} />
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      </main>
    </>
  );
}
