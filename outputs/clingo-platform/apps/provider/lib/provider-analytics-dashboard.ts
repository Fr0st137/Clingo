import type { Employee } from "./provider-client";
import { analyzeJobs, employeeKey, employeeLabel, rangeDays, type AnalyticsFilters } from "./provider-analytics";
import type { Job } from "./provider-jobs";
import { parseDay, shiftDate } from "./provider-schedule";

export type AnalyticsAbsence = { employeeIds?: string[]; employees: string[]; start: string; end: string };
type Interval = [number, number];
const minute = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
function union(rows: Interval[]): Interval[] {
  const result: Interval[] = [];
  for (const row of rows.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a).sort((a, b) => a[0] - b[0])) {
    const last = result.at(-1);
    if (last && row[0] <= last[1]) last[1] = Math.max(last[1], row[1]); else result.push([...row]);
  }
  return result;
}
const duration = (rows: Interval[]) => rows.reduce((sum, [a, b]) => sum + b - a, 0);
const intersection = (a: Interval[], b: Interval[]): Interval[] => a.flatMap(([x, y]) => b.map(([u, v]) => [Math.max(x, u), Math.min(y, v)] as Interval).filter(([x, y]) => y > x));
function available(employee: Employee, date: string, absences: AnalyticsAbsence[]): Interval[] {
  const shift = employee.schedule.find(day => day.day === parseDay(date).getUTCDay());
  if (!shift?.enabled) return [];
  let work: Interval[] = [[minute(shift.start), minute(shift.end)]];
  for (const absence of absences.filter(row => (row.employeeIds ? row.employeeIds.includes(employee.id) : row.employees.includes(employee.name)) && row.start.slice(0, 10) <= date && row.end.slice(0, 10) >= date)) {
    const start = absence.start.slice(0, 10) === date ? minute(absence.start.slice(11)) : 0;
    const end = absence.end.slice(0, 10) === date ? minute(absence.end.slice(11)) : 1440;
    work = work.flatMap(([a, b]) => end <= a || start >= b ? [[a, b] as Interval] : [[a, Math.min(b, start)], [Math.max(a, end), b]].filter(([a, b]) => b > a) as Interval[]);
  }
  return union(work);
}
export function scheduleUsage(jobs: Job[], employees: Employee[], absences: AnalyticsAbsence[], start: string, end: string) {
  const cells = Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => ({ available: 0, booked: 0 })));
  const staff = new Map<string, { available: number; booked: number }>();
  let totalAvailable = 0, totalBooked = 0;
  if (!rangeDays(start, end)) return { rate: null, staff, cells, available: 0, booked: 0 };
  for (let date = start; date <= end; date = shiftDate(date, 1)) {
    const day = (parseDay(date).getUTCDay() + 6) % 7;
    for (const employee of employees) {
      const work = available(employee, date, absences);
      const booked = intersection(work, union(jobs.filter(job => (job.employeeIds?.includes(employee.id) || job.employeeId === employee.id) && job.date === date && job.status !== "cancelled").map(job => [job.startMinute, job.startMinute + job.durationMinutes])));
      const stats = staff.get(employee.id) ?? { available: 0, booked: 0 };
      stats.available += duration(work); stats.booked += duration(booked); staff.set(employee.id, stats);
      totalAvailable += duration(work); totalBooked += duration(booked);
      for (let hour = 0; hour < 7; hour++) {
        const interval: Interval[] = [[480 + hour * 120, 600 + hour * 120]];
        cells[day][hour].available += duration(intersection(work, interval));
        cells[day][hour].booked += duration(intersection(booked, interval));
      }
    }
  }
  return { rate: totalAvailable ? totalBooked / totalAvailable * 100 : null, staff, cells, available: totalAvailable, booked: totalBooked };
}
export const isRescheduled = (job: Job) => !!job.providerMessages?.some(message => message.type === "rescheduled") || !!job.notes?.includes("[Przełożenie");
export const rate = (count: number, total: number) => total ? count / total * 100 : 0;

export function dashboardAnalytics(jobs: Job[], filters: AnalyticsFilters, employees: Employee[], absences: AnalyticsAbsence[]) {
  const report = analyzeJobs(jobs, filters);
  if (!report) return null;
  const selectedStaff = employees.filter(employee => !filters.employee || employee.id === filters.employee);
  const usage = scheduleUsage(report.current, selectedStaff, absences, filters.start, filters.end);
  const previousUsage = scheduleUsage(report.previous, selectedStaff, absences, report.previousStart, report.previousEnd);
  const previousReport = analyzeJobs(jobs, { ...filters, start: report.previousStart, end: report.previousEnd })!;
  const status = { completed: report.counts.completed, cancelled: report.counts.cancelled, rescheduled: report.current.filter(job => job.status === "scheduled" && isRescheduled(job)).length, scheduled: report.current.filter(job => job.status === "scheduled" && !isRescheduled(job)).length };
  const cancellationRate = rate(report.counts.cancelled, report.current.length), previousCancellationRate = rate(previousReport.counts.cancelled, report.previous.length);
  const returningRate = rate(report.returning, report.activeClients), previousReturningRate = rate(previousReport.returning, previousReport.activeClients);
  const clientCounts = new Map<string, number>();
  for (const job of report.current.filter(job => job.status === "completed")) clientCounts.set(job.clientId, (clientCounts.get(job.clientId) ?? 0) + 1);
  const rebooked = [...clientCounts.values()].filter(count => count > 1).length;
  const addOns = new Map<string, { id: string; name: string; count: number }>();
  for (const job of report.current.filter(job => job.status === "completed")) for (const addon of job.addOns ?? []) {
    if (addon.quantity <= 0) continue;
    const row = addOns.get(addon.id) ?? { id: addon.id, name: addon.label, count: 0 };
    // Count orders containing the extra, rather than multiplying by its quantity.
    row.count++; addOns.set(addon.id, row);
  }
  const services = report.services.map(row => ({ ...row, previousValue: previousReport.services.find(old => old.id === row.id)?.value ?? 0, perHour: row.hours ? row.value / row.hours : 0 }));
  const staffIds = Array.from(new Set([...selectedStaff.map(employee => employee.id), ...report.employees.map(row => row.id)]));
  const staff = staffIds.map(id => {
    const data = report.employees.find(row => row.id === id);
    const bookings = report.current.filter(job => employeeKey(job) === id);
    const work = usage.staff.get(id);
    return { id, name: selectedStaff.find(employee => employee.id === id)?.name ?? data?.name ?? employeeLabel(bookings[0]), value: data?.value ?? 0, count: data?.count ?? 0, hours: data?.hours ?? 0, utilization: work?.available ? work.booked / work.available * 100 : null, previousValue: previousReport.employees.find(row => row.id === id)?.value ?? 0 };
  }).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pl"));
  const free = usage.cells.flatMap((row, day) => row.map((cell, hour) => ({ ...cell, day, hour }))).filter(cell => cell.available > cell.booked).sort((a, b) => (b.available - b.booked) - (a.available - a.booked))[0];
  return { ...report, usage, previousUsage, cancellationRate, previousCancellationRate, returningRate, previousReturningRate, status, services, staff, rebooked, newClients: report.activeClients - report.returning, addOns: [...addOns.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pl")), lostValue: report.current.filter(job => job.status === "cancelled").reduce((sum, job) => sum + job.priceMinor, 0), free };
}
