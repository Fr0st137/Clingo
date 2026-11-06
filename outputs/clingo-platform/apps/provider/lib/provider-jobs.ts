import { parseDay, shiftDate, weekDates, warsawToday } from "./provider-schedule";
export type Job = { customerPhotos?: import("../../api/src/dashboard/booking-photo.types").BookingPhotoRef[]; id: string; clientId: string; offerId: string; employeeId: string | null; date: string; startMinute: number; durationMinutes: number; priceMinor: number; notes: string; status: "scheduled" | "completed" | "cancelled"; revision: number; clientName: string; clientPhone: string; clientEmail: string; address: string; serviceTitle: string; employeeName: string; multiOrderId?: string | null; sessionIndex?: number | null; sessionCount?: number | null;
  source?: "booking"; bookingId?: string; startsAt?: string; endsAt?: string;
  summary?: { duration: string; total: string; lines: Array<{ id: string; label: string; value: string }> } | null;
  addOns?: Array<{ id: string; label: string; quantity: number }>;
  invoice?: { companyName: string; taxId: string; address: string } | null;
  frequencyLabel?: string | null;
  accessMethod?: import("../../api/src/dashboard/booking-access").AccessMethod;
  estimatedWorkers?: number;
  isProject?: boolean;
  releasedByCompletion?: boolean;
  projectCompletedAt?: string;
  sessionId?: string;
  employees?: Array<{ id: string; name: string }>;
  employeeIds?: string[];
  providerMessages?: Array<{ type: "cancelled" | "rescheduled"; message: string; createdAt: string }>;
};
export type JobDraft = { clientId: string; offerId: string; employeeId: string; date: string; time: string; duration: string; price: string; notes: string; status: Job["status"] };
export const jobStatuses = { scheduled: "Zaplanowane", completed: "Zakończone", cancelled: "Odwołane" };
export function manualJobPayload(job: Job, changes: Partial<Pick<Job, "employeeId" | "date" | "startMinute" | "durationMinutes" | "priceMinor" | "notes" | "status">> = {}) {
  return { clientId: job.clientId, offerId: job.offerId, employeeId: job.employeeId, date: job.date, startMinute: job.startMinute, durationMinutes: job.durationMinutes, priceMinor: job.priceMinor, notes: job.notes, status: job.status, ...changes, revision: job.revision };
}
export function orderActionNotes(notes: string, action: "cancelled" | "reschedule", message: string) {
  if (message.length > 100) throw new Error("Wiadomość może zawierać maksymalnie 100 znaków.");
  const next = message.trim() ? [notes, `[${action === "cancelled" ? "Odwołanie" : "Przełożenie"} — wiadomość do klienta]\n${message.trim()}`].filter(Boolean).join("\n\n") : notes;
  if (next.length > 2000) throw new Error("Brak miejsca na wiadomość w notatkach zamówienia. Skróć notatkę przed zapisaniem zmiany.");
  return next;
}
export const timeLabel = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2,"0")}:${String(minute % 60).padStart(2,"0")}`;
export const jobDraft = (job?: Job, date = warsawToday()): JobDraft => job ? { clientId: job.clientId, offerId: job.offerId, employeeId: job.employeeId ?? "", date: job.date, time: timeLabel(job.startMinute), duration: String(job.durationMinutes), price: (job.priceMinor / 100).toFixed(2).replace(".",","), notes: job.notes, status: job.status } : { clientId: "", offerId: "", employeeId: "", date, time: "09:00", duration: "60", price: "", notes: "", status: "scheduled" };
export type CalendarView = "month" | "week" | "day";
export function calendarDates(date: string, view: CalendarView) {
  if (view === "day") return [date];
  if (view === "week") return weekDates(date);
  const first = weekDates(`${date.slice(0,7)}-01`)[0];
  const month = parseDay(`${date.slice(0,7)}-01`);
  const last = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).toISOString().slice(0,10);
  const final = weekDates(last)[6];
  const length = Math.round((parseDay(final).getTime() - parseDay(first).getTime()) / 86400000) + 1;
  return Array.from({length},(_,index)=>shiftDate(first,index));
}
export function shiftCalendar(date: string, view: CalendarView, direction: number) {
  if (view !== "month") return shiftDate(date, direction * (view === "week" ? 7 : 1));
  const value = parseDay(`${date.slice(0,7)}-01`); value.setUTCMonth(value.getUTCMonth()+direction); return value.toISOString().slice(0,10);
}
