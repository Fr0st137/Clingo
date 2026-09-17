import type { BookingPageProps } from "./booking-client";

export type MultiSessionBookingSession = {
  id: number;
  title: string;
  date: string;
  duration: string;
  workers: string;
  workerCount?: number;
  start: string;
  end: string;
  newSession?: boolean;
};

export type MultiSessionBookingState = {
  selectedDate: string;
  selectedTime: string;
  sessions: MultiSessionBookingSession[];
};

export function multiSessionStorageKey(props: BookingPageProps) {
  return `clingo-multi-session:${props.user.id}:${JSON.stringify(props.selection)}:${props.initialAddress}`;
}

export function multiSessionDateValue(displayDate: string) {
  const [day, month, year] = displayDate.split(".");
  return /^\d{2}$/.test(day) && /^\d{2}$/.test(month) && /^\d{4}$/.test(year) ? `${year}-${month}-${day}` : "";
}

function warsawDate(date: string, time: string) {
  const target = Date.parse(`${date}T${time}:00Z`);
  let result = new Date(target);
  const formatter = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", ...options });
  const localDate = (value: Date) => {
    const parts = formatter({ year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
    return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)!.value).join("-");
  };
  const localTime = (value: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(value);
  for (let index = 0; index < 3; index += 1) {
    const represented = Date.parse(`${localDate(result)}T${localTime(result)}:00Z`);
    result = new Date(result.getTime() + target - represented);
  }
  return result;
}

export function multiSessionIso(displayDate: string, time: string) {
  const date = multiSessionDateValue(displayDate);
  return date && /^\d{2}:\d{2}$/.test(time) ? warsawDate(date, time).toISOString() : "";
}

export function isMultiSessionBookingState(value: unknown): value is MultiSessionBookingState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<MultiSessionBookingState>;
  return typeof state.selectedDate === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(state.selectedDate)
    && typeof state.selectedTime === "string"
    && Array.isArray(state.sessions)
    && state.sessions.length > 0
    && state.sessions.every((session) => session
      && typeof session.id === "number"
      && typeof session.date === "string"
      && typeof session.duration === "string"
      && (session.workerCount === undefined || Number.isInteger(session.workerCount))
      && typeof session.start === "string"
      && typeof session.end === "string");
}
