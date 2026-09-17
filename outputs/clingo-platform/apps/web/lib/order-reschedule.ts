import type { CalendarAvailability } from "../components/schedule-date-time-picker";
export type RescheduleAvailability = CalendarAvailability & { currentStartsAt: string; currentEndsAt: string; duration: string };
export type RescheduleResult<T> = { data: T; error?: never } | { error: string; data?: never };
export type RescheduleActions = {
  loadAvailability: (month: string, sessionIndex?: number) => Promise<RescheduleResult<RescheduleAvailability>>;
  save: (startsAt: string, endsAt: string, sessionIndex?: number) => Promise<RescheduleResult<true>>;
};
