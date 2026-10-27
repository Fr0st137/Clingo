import { ConflictException } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { ProviderAccountEntity, ProviderEmployeeEntity } from "../provider/provider.entity";
import { staffingLimit } from "../provider/provider-staffing";
import { ProviderOfferEntity } from "../provider/provider-offers.entity";
import { ProviderJobEntity } from "../provider/provider-jobs.entity";
import { ProviderProfileEntity } from "./provider-profile.entity";
import { accountBookings, bookingSessions, bookingStatus } from "./booking-bridge";
import { addLocalDays, bookingLimit, daySlots, localDate, warsawDate, type WorkingHours } from "./booking";
import { MAX_BOOKING_SESSIONS } from "./booking-policy";
import { defaultWorkingHours } from "./booking-policy";

export type AssignedEmployee = { id: string; name: string };
type Occupied = { startsAt: Date; endsAt: Date; employeeIds: string[] | null; bufferMinutes: number };
export type Staffing = { employees: ProviderEmployeeEntity[]; occupied: Occupied[]; category?: string };

async function roster(manager: EntityManager, profile: ProviderProfileEntity) {
  const employees = await manager.find(ProviderEmployeeEntity, { where: { accountId: profile.accountId! }, order: { id: "ASC" } });
  const source = /^service-[a-f0-9-]{36}$/i.test(profile.id) ? await manager.findOneBy(ProviderOfferEntity, { id: profile.id.slice(8), accountId: profile.accountId! }) : null;
  return { employees, category: source?.category };
}

export function rosterHours(employees: ProviderEmployeeEntity[], base: WorkingHours) {
  const shifts = employees.flatMap(employee => employee.schedule.filter(row => row.enabled));
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  return { ...base, days: [...new Set(shifts.map(row => row.day))], startHour: shifts.length ? Math.ceil(Math.min(...shifts.map(row => minutes(row.start))) / 15) / 4 : 8,
    endHour: shifts.length ? Math.floor(Math.max(...shifts.map(row => minutes(row.end))) / 15) / 4 : 20 };
}

export function rosterCapacity(employees: ProviderEmployeeEntity[], workers: number) {
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  let maximum = 0;
  for (let day = 0; day < 7; day++) {
    const shifts = employees.flatMap(employee => employee.schedule.filter(row => row.enabled && row.day === day));
    for (const shift of shifts) {
      const start = Math.ceil(minutes(shift.start) / 15) * 15;
      const ends = shifts.filter(row => minutes(row.start) <= start).map(row => Math.floor(minutes(row.end) / 15) * 15).sort((a,b) => b-a);
      if (ends.length >= workers) maximum = Math.max(maximum, ends[workers-1] - start);
    }
  }
  return Math.min(720, maximum);
}

export async function withRosterHours(manager: EntityManager, profile: ProviderProfileEntity) {
  if (!profile.accountId) return profile;
  const staff = await roster(manager, profile), eligible = staff.employees.filter(row => !staff.category || row.services.includes(staff.category));
  const account = await manager.findOneBy(ProviderAccountEntity, { id: profile.accountId });
  const limit = staffingLimit(account ?? { staffingMode: "team", declaredStaff: null }, staff.employees.length);
  const staffingValid = staff.employees.length > 0 && !(account?.staffingMode === "solo" && staff.employees.length > 1) && (profile.areaPricing?.workerTiers ?? []).every(row => row.workers <= limit);
  return { ...profile, staffingValid, bookingSettings: rosterHours(eligible, profile.bookingSettings ?? defaultWorkingHours),
    areaPricing: profile.areaPricing ? { ...profile.areaPricing, dailyCapacityByWorkers: Object.fromEntries([...new Set([1, ...(profile.areaPricing.workerTiers?.map(row => row.workers) ?? [])])].map(workers => [String(workers), rosterCapacity(eligible, workers)])) } : null };
}

// No employee data is returned by public availability/schedule endpoints.
export async function loadStaffing(manager: EntityManager, profile: ProviderProfileEntity, excluding?: { orderId?: string; sessionIndex?: number; jobId?: string; manualProjectId?: string }): Promise<Staffing | null> {
  if (!profile.accountId) return null; // Independent legacy catalogue entries keep their old calendar.
  const { employees, category } = await roster(manager, profile);
  const profiles = await manager.find(ProviderProfileEntity, { where: { accountId: profile.accountId } });
  const buffers = new Map(profiles.map(row => [row.id, row.bookingSettings?.bufferMinutes ?? 0]));
  const occupied: Occupied[] = [];
  const offers = await manager.find(ProviderOfferEntity, { where: { accountId: profile.accountId } });
  for (const order of await accountBookings(manager, profile.accountId)) {
    if (bookingStatus(order.status) !== "scheduled") continue;
    for (const [index, session] of bookingSessions(order).entries()) {
      if (order.id === excluding?.orderId && (excluding.sessionIndex === undefined || index === excluding.sessionIndex)) continue;
      const assignments = order.selectedOptions?.sessions?.[index]?.employees ?? order.selectedOptions?.employees;
      occupied.push({ ...session, employeeIds: assignments?.length ? assignments.map(row => row.id) : null, bufferMinutes: buffers.get(order.providerId!) ?? 0 });
    }
  }
  for (const job of await manager.find(ProviderJobEntity, { where: { accountId: profile.accountId, status: "scheduled" } })) {
    if (job.id === excluding?.jobId || job.multiOrderId && job.multiOrderId===excluding?.manualProjectId) continue;
    const start = warsawDate(job.date, `${String(Math.floor(job.startMinute / 60)).padStart(2, "0")}:${String(job.startMinute % 60).padStart(2, "0")}`);
    const config = offers.find(row => row.id === job.offerId)?.configuration;
    occupied.push({ startsAt: start, endsAt: new Date(+start + job.durationMinutes * 60_000), employeeIds: job.employees?.length ? job.employees.map(row=>row.id) : job.employeeId ? [job.employeeId] : null, bufferMinutes: config?.bufferEnabled ? config.bufferMinutes : 0 });
  }
  const absences: Array<{ starts_at: Date; ends_at: Date; employees: AssignedEmployee[] }> = await manager.query("SELECT starts_at, ends_at, employees FROM provider_absences WHERE account_id=$1 AND cancelled=false", [profile.accountId]);
  for (const absence of absences) occupied.push({ startsAt: new Date(absence.starts_at), endsAt: new Date(absence.ends_at), employeeIds: absence.employees.map(row => row.id), bufferMinutes: 0 });
  return { employees, occupied, category };
}

export function freeEmployees(staff: Staffing, startsAt: Date, endsAt: Date, bufferMinutes = 0): AssignedEmployee[] {
  const date = localDate(startsAt), day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return staff.employees.filter(employee => {
    if (staff.category && !employee.services.includes(staff.category)) return false;
    const shift = employee.schedule.find(row => row.day === day && row.enabled);
    if (!shift || +startsAt < +warsawDate(date, shift.start) || +endsAt > +warsawDate(date, shift.end)) return false;
    return !staff.occupied.some(row => {
      const buffer = Math.max(bufferMinutes, row.bufferMinutes) * 60_000;
      return (row.employeeIds === null || row.employeeIds.includes(employee.id)) && +startsAt < +row.endsAt + buffer && +row.startsAt < +endsAt + buffer;
    });
  }).map(({ id, name }) => ({ id, name })).sort((a, b) => a.id.localeCompare(b.id));
}

export function staffedSlots(staff: Staffing, date: string, duration: number, workers: number, hours: WorkingHours, now = new Date()) {
  return daySlots(date, duration, [], hours, now).filter(slot => freeEmployees(staff, new Date(slot.startsAt), new Date(slot.endsAt), hours.bufferMinutes).length >= workers);
}

export function assignStaff(staff: Staffing, startsAt: Date, endsAt: Date, workers: number, bufferMinutes: number, preferredIds?: string[]) {
  const available = freeEmployees(staff, startsAt, endsAt, bufferMinutes);
  const assigned = preferredIds ? preferredIds.map(id => available.find(row => row.id === id)) : available.slice(0, workers);
  if (assigned.length !== workers || assigned.some(row => !row) || new Set(assigned.map(row => row!.id)).size !== workers) throw new ConflictException("Brak wymaganej liczby wolnych pracowników w tym terminie. Wybierz inny termin lub zmień obsadę.");
  const employees = assigned as AssignedEmployee[];
  staff.occupied.push({ startsAt, endsAt, employeeIds: employees.map(row => row.id), bufferMinutes });
  return employees;
}

export function planStaffedSessions(staff: Staffing, totalMinutes: number, workers: number, start: Date, hours: WorkingHours, now = new Date(), excludedDates: string[] = []) {
  // Validate dates and exclusions using the same constraints as ordinary scheduling.
  if (!Number.isInteger(totalMinutes) || totalMinutes < 15 || !Number.isFinite(+start) || !Array.isArray(excludedDates) || excludedDates.length > MAX_BOOKING_SESSIONS || excludedDates.some(date => typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new ConflictException("Nieprawidłowy termin lub lista wyłączonych dat.");
  const firstDate = localDate(start), lastDate = bookingLimit(now);
  if (firstDate < localDate(now) || firstDate > lastDate) throw new ConflictException("Wybierz termin w ciągu najbliższych sześciu miesięcy.");
  const sessions: Array<{ startsAt: Date; endsAt: Date; employees: AssignedEmployee[] }> = [];
  let remaining = totalMinutes, previousDate = firstDate;
  for (let date = firstDate; date <= lastDate && remaining; date = addLocalDays(date, 1)) {
    if ((Date.parse(date) - Date.parse(previousDate)) / 86400000 > 3) break;
    if (excludedDates.includes(date)) continue;
    const slots = staffedSlots(staff, date, 15, workers, hours, now);
    if (date === firstDate && !slots.some(slot => slot.startsAt === start.toISOString())) throw new ConflictException("Wybrany termin nie ma już wymaganej obsady. Wybierz inną datę lub godzinę.");
    for (const slot of slots) {
      const from = new Date(slot.startsAt);
      if (date === firstDate && +from < +start) continue;
      const previous = sessions.at(-1);
      if (previous && +from < +previous.endsAt + hours.bufferMinutes * 60000) continue;
      let max = Math.min(remaining, 720, (+warsawDate(date, `${String(Math.floor(hours.endHour)).padStart(2, "0")}:${String(Math.round(hours.endHour % 1 * 60)).padStart(2, "0")}`) - +from) / 60000);
      if (remaining > max && remaining - max < 15) max -= 15;
      for (let duration = max; duration >= 15; duration -= 15) {
        const to = new Date(+from + duration * 60000);
        if (freeEmployees(staff, from, to, hours.bufferMinutes).length < workers) continue;
        if (sessions.length >= MAX_BOOKING_SESSIONS) throw new ConflictException("Harmonogram wymaga zbyt wielu sesji.");
        sessions.push({ startsAt: from, endsAt: to, employees: assignStaff(staff, from, to, workers, hours.bufferMinutes) });
        remaining -= duration; previousDate = date; break;
      }
      if (!remaining) break;
    }
  }
  if (remaining) throw new ConflictException("Nie można ułożyć pełnego harmonogramu z wymaganą obsadą i maksymalnie dwoma pełnymi dniami przerwy. Zmień termin lub dostępność.");
  return sessions;
}
