// Pure rules shared by catalogue, checkout and the API.
export type WorkingHours = { days: number[]; startHour: number; endHour: number; bufferMinutes: number; leadHours: number };
export const defaultWorkingHours: WorkingHours = { days: [1, 2, 3, 4, 5, 6], startHour: 8, endHour: 20, bufferMinutes: 0, leadHours: 0 };
export const MAX_BOOKING_SESSIONS = 186;
export const MAX_SESSION_MINUTES = 12 * 60;

export function durationMinutes(value: string) {
  return Number(value.match(/(\d+)\s*(?:godz|h)/)?.[1] ?? 0) * 60 + Number(value.match(/(\d+)\s*min/)?.[1] ?? 0);
}

export function sessionCapacity(hours?: WorkingHours | null) {
  const work = hours ?? defaultWorkingHours;
  return work.days.length ? Math.max(0, Math.min(MAX_SESSION_MINUTES, Math.floor((work.endHour - work.startHour) * 60 / 15) * 15)) : 0;
}

export function bookingMode(minutes: number, profile: { areaPricing?: { maxSessionMinutes?: number; dailyCapacityByWorkers?: Record<string, number> } | null; bookingSettings?: WorkingHours | null; tags?: string[] }, splitIntoSessions = false, workers = 1): "single" | "multi" {
  if (splitIntoSessions) return "multi";
  if (profile.areaPricing) return minutes > (profile.areaPricing.dailyCapacityByWorkers?.[String(workers)] ?? (profile.bookingSettings ? sessionCapacity(profile.bookingSettings) : profile.areaPricing.maxSessionMinutes ?? sessionCapacity())) ? "multi" : "single";
  return profile.tags?.some(tag => tag.toLocaleLowerCase("pl-PL") === "wielosesyjne") ? "multi" : "single";
}
