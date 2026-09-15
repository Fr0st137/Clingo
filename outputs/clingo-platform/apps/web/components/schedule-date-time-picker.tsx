"use client";
import { bookingDate, type BookingSlot } from "../lib/booking-client";
export type CalendarAvailability = { days: Array<{ date: string; slots: BookingSlot[] }>; today: string; maxDate: string };
const periods = {
  Rano: [
    "08:00", "08:15", "08:30", "08:45", "09:00", "09:15", "09:30", "09:45", "10:00", "10:15",
    "10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45"
  ],
  Południe: [
    "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00", "14:15",
    "14:30", "14:45", "15:00", "15:15", "15:30", "15:45", "16:00", "16:15", "16:30", "16:45"
  ],
  Wieczór: ["17:00", "17:15", "17:30", "17:45", "18:00", "18:15", "18:30", "18:45", "19:00", "19:15", "19:30", "19:45"]
} as const;

export type Period = keyof typeof periods;
function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function PreviewCalendar({
  availability,
  loading,
  month,
  onMonthChange,
  onSelect,
  selectedDate,
  variant,
  currentDate
}: {
  availability: CalendarAvailability | null;
  loading: boolean;
  month: string;
  onMonthChange: (delta: number) => void;
  onSelect: (date: string) => void;
  selectedDate: string;
  variant?: "reschedule";
  currentDate?: string;
}) {
  const monthStart = new Date(`${month}-01T12:00:00Z`);
  const offset = (monthStart.getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthStart);
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    const date = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day)).toISOString().slice(0, 10);
    return { date, day: Number(date.slice(-2)), outside: day < 1 || day > dayCount };
  });
  return (
    <section className={`w-full overflow-hidden bg-white ${variant === "reschedule" ? "rounded-[20px] border border-[#e5e7eb] p-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.04)]" : "rounded-[15px] shadow-[0_4px_7px_rgba(0,0,0,0.04)]"}`} aria-label="Kalendarz terminów">
      <header className="flex h-[48px] items-center justify-between border-b border-[#e5e7eb] px-[24px]">
        <button aria-label="Poprzedni miesiąc" className="grid h-8 w-8 place-items-center rounded-lg disabled:opacity-30" disabled={month <= (availability?.today ?? bookingDate()).slice(0, 7)} onClick={() => onMonthChange(-1)} type="button">
          <img alt="" className="h-[14px] w-[9px]" src="/figma-assets/schedule-chevron-left.svg" />
        </button>
        <h2 className="m-0 text-[14px] font-semibold capitalize leading-5 text-[#2e3b4c]">{monthLabel}</h2>
        <button aria-label="Następny miesiąc" className="grid h-8 w-8 place-items-center rounded-lg disabled:opacity-30" disabled={!availability || month >= availability.maxDate.slice(0, 7)} onClick={() => onMonthChange(1)} type="button">
          <img alt="" className="h-[14px] w-[9px]" src="/figma-assets/schedule-chevron-right.svg" />
        </button>
      </header>

      <div className="grid grid-cols-7 border-b border-[#e5e7eb] px-[16px] py-[12px]">
        {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((day) => (
          <span className="text-center text-[12px] font-medium uppercase leading-4 text-[#6b7280]" key={day}>{day}</span>
        ))}
      </div>

      <div className={`grid grid-cols-7 grid-rows-6 overflow-hidden ${variant === "reschedule" ? "rounded-[10px]" : "py-[5px]"}`}>
        {cells.map((item, index) => {
          const slots = availability?.days.find(day => day.date === item.date)?.slots ?? [];
          const selected = !item.outside && item.date === selectedDate;
          const available = !item.outside && slots.length > 0;
          return (
            <button
              aria-label={`${item.date}${available ? ", dostępny" : ", niedostępny"}`}
              aria-pressed={selected}
              className={[
                `relative flex items-center justify-center border-b border-r border-[#e5e7eb] text-[14px] leading-5 transition-colors ${variant === "reschedule" ? "h-[67px]" : "h-[50px]"}`,
                index % 7 === 6 ? "border-r-0" : "",
                index >= 35 ? "border-b-0" : "",
                item.outside ? "bg-[#f4f6f9] text-[#d1d5db]" : "text-[#7c8691] hover:bg-[#f4f6f9]",
                !available && variant === "reschedule" ? "bg-[#f4f6f9]" : "",
                selected ? `m-[5px] border-0 bg-[#0079de] font-medium text-white hover:bg-[#0079de] ${variant === "reschedule" ? "!h-[57px] rounded-[15px]" : "!h-[40px] rounded-[10px]"}` : ""
              ].join(" ")}
              disabled={loading || item.outside || !available}
              key={item.date}
              onClick={() => onSelect(item.date)}
              type="button"
            >
              {item.day}
              {item.date === currentDate ? <span className="absolute right-[10px] top-[10px] h-[6px] w-[6px] rounded-full bg-[#0079de]" /> : null}
              {!item.outside && !selected && !loading && (!variant || item.date >= (availability?.today ?? bookingDate())) ? (
                <span className={`absolute bottom-[9px] h-px w-[16px] ${available ? "bg-[#36a269]" : "bg-[#d13239]"}`} />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function TimePicker({
  period,
  selectedTime,
  slots,
  loading,
  availabilityStart,
  availabilityEnd,
  onPeriodChange,
  onTimeSelect,
  variant
}: {
  period: Period;
  selectedTime: string | null;
  slots: BookingSlot[];
  loading: boolean;
  availabilityStart: string;
  availabilityEnd: string;
  onPeriodChange: (period: Period) => void;
  onTimeSelect: (slot: BookingSlot) => void;
  variant?: "reschedule";
}) {
  const withinAvailability = (time: string) => {
    const minutes = timeToMinutes(time);
    return minutes >= timeToMinutes(availabilityStart) && minutes <= timeToMinutes(availabilityEnd);
  };

  return (
    <section className={`grid w-full ${variant === "reschedule" ? "gap-[20px]" : "gap-[10px]"}`} aria-label="Wybór godziny">
      <div className={`flex h-[51px] items-center rounded-[30px] bg-[#f4f6f9] p-[7px] ${variant === "reschedule" ? "border border-[#e5e7eb] shadow-[0_4px_7px_rgba(0,0,0,0.04)]" : ""}`}>
        {(Object.keys(periods) as Period[]).map((label) => (
          <button
            aria-pressed={period === label}
            className={`h-[37px] flex-1 rounded-[30px] text-[14px] font-medium transition-colors ${period === label ? "bg-white text-[#0079de] shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-[#2e3b4c]"}`}
            key={label}
            onClick={() => onPeriodChange(label)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-4 ${variant === "reschedule" ? "min-h-[270px] content-start gap-[8px]" : "gap-[7px]"}`}>
        {periods[period].map((time) => {
          const slot = slots.find(item => item.time === time);
          const unavailable = loading || !slot || !withinAvailability(time);
          const selected = selectedTime === time;
          return (
            <button
              aria-label={`Godzina ${time}`}
              aria-pressed={selected}
              className={[
                "h-[46px] rounded-[30px] border text-[14px] transition-colors",
                selected ? "border-[#0079de] bg-[#0079de] font-medium text-white" : "",
                !selected && unavailable ? "border-[#f0f2f4] bg-[#f4f6f9] text-[#afb5bf]" : "",
                !selected && !unavailable ? "border-[#f0f2f4] bg-white font-medium text-[#2e3b4c] hover:border-[#bfdbfe]" : ""
              ].join(" ")}
              disabled={unavailable}
              key={time}
              onClick={() => slot && onTimeSelect(slot)}
              type="button"
            >
              {time}
            </button>
          );
        })}
      </div>
    </section>
  );
}
