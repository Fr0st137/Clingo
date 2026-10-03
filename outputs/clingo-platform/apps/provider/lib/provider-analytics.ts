import { jobStatuses, timeLabel, type Job } from "./provider-jobs";
import { parseDay, shiftDate } from "./provider-schedule";

export type AnalyticsFilters = { start: string; end: string; offer: string; employee: string };
export type AnalyticsMetric = "value" | "count" | "hours";
export const employeeKey = (job: Job) => job.employeeId ?? (job.employeeName ? `former:${job.employeeName}` : "unassigned");
export const employeeLabel = (job: Job) => job.employeeId ? job.employeeName : job.employeeName ? `${job.employeeName} (usunięty)` : "Bez przypisania";
export const money = (minor: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(minor / 100);
export const numberLabel = (value: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(value);

export function rangeDays(start: string, end: string) {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parseDay(value).getTime()) && parseDay(value).toISOString().slice(0, 10) === value;
  if (!valid(start) || !valid(end)) return 0;
  const count = Math.round((parseDay(end).getTime() - parseDay(start).getTime()) / 86400000) + 1;
  return count > 0 && count <= 366 ? count : 0;
}

function totals(jobs: Job[]) {
  const completed = jobs.filter(job => job.status === "completed");
  const value = completed.reduce((sum, job) => sum + job.priceMinor, 0);
  return { value, count: completed.length, hours: completed.reduce((sum, job) => sum + job.durationMinutes, 0) / 60, average: completed.length ? value / completed.length : 0 };
}

function ranking(jobs: Job[], key: (job: Job) => string, label: (job: Job) => string) {
  const groups = new Map<string, { id: string; name: string; jobs: Job[] }>();
  for (const job of jobs.filter(job => job.status === "completed")) {
    const id = key(job);
    const group = groups.get(id) ?? { id, name: label(job), jobs: [] };
    group.jobs.push(job);
    groups.set(id, group);
  }
  return [...groups.values()].map(group => ({ id: group.id, name: group.name, ...totals(group.jobs) })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pl"));
}

export function analyzeJobs(jobs: Job[], filters: AnalyticsFilters) {
  const days = rangeDays(filters.start, filters.end);
  if (!days) return null;
  const previousStart = shiftDate(filters.start, -days);
  const previousEnd = shiftDate(filters.start, -1);
  const scoped = jobs.filter(job => (!filters.offer || job.offerId === filters.offer) && (!filters.employee || employeeKey(job) === filters.employee));
  const current = scoped.filter(job => job.date >= filters.start && job.date <= filters.end).sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute || a.id.localeCompare(b.id));
  const previous = scoped.filter(job => job.date >= previousStart && job.date <= previousEnd);
  const counts = { scheduled: 0, completed: 0, cancelled: 0 };
  current.forEach(job => counts[job.status]++);
  const activeClients = new Set(current.filter(job => job.status === "completed").map(job => job.clientId));
  const returning = [...activeClients].filter(id => scoped.filter(job => job.clientId === id && job.status === "completed" && job.date <= filters.end).length > 1).length;
  const bucketSize = Math.ceil(days / 12);
  const series = Array.from({ length: Math.ceil(days / bucketSize) }, (_, index) => {
    const offset = index * bucketSize;
    const length = Math.min(bucketSize, days - offset);
    const start = shiftDate(filters.start, offset);
    const end = shiftDate(start, length - 1);
    const comparisonStart = shiftDate(previousStart, offset);
    const comparisonEnd = shiftDate(comparisonStart, length - 1);
    return { start, end, comparisonStart, comparisonEnd, current: totals(current.filter(job => job.date >= start && job.date <= end)), previous: totals(previous.filter(job => job.date >= comparisonStart && job.date <= comparisonEnd)) };
  });
  return { current, previousStart, previousEnd, totals: totals(current), previousTotals: totals(previous), counts, activeClients: activeClients.size, returning, series, services: ranking(current, job => job.offerId, job => job.serviceTitle), employees: ranking(current, employeeKey, employeeLabel) };
}

export function percentageChange(current: number, previous: number) {
  if (!previous) return current ? "Brak wartości bazowej" : "Bez zmian";
  const value = (current - previous) / previous * 100;
  return `${value > 0 ? "+" : ""}${numberLabel(value)}%`;
}

export function analyticsCsv(jobs: Job[]) {
  // Quote every cell and neutralize formula prefixes, including leading whitespace.
  const cell = (value: string) => `"${(/^[\s\uFEFF]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? "'" : "") + value.replace(/"/g, '""')}"`;
  const rows = [["Data", "Godzina", "Usługa", "Pracownik", "Status", "Czas zlecenia (min)", "Wartość (PLN)"], ...jobs.map(job => [job.date, timeLabel(job.startMinute), job.serviceTitle, employeeLabel(job), jobStatuses[job.status], String(job.durationMinutes), (job.priceMinor / 100).toFixed(2).replace(".", ",")])];
  return "\uFEFF" + rows.map(row => row.map(cell).join(";")).join("\r\n");
}
