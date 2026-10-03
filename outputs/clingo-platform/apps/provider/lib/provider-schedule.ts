import { dayMinutes, type Employee } from "./provider-client";
export function warsawToday() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function parseDay(date: string) { return new Date(`${date}T12:00:00Z`); }
export function shiftDate(date: string, days: number) { const value = parseDay(date); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
export function weekDates(date: string) { const monday = shiftDate(date, -((parseDay(date).getUTCDay() + 6) % 7)); return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i)); }
export function scheduleOn(employee: Employee, date: string) { return employee.schedule.find(day => day.day === parseDay(date).getUTCDay())!; }
export function monthMinutes(employee: Employee, date: string) {
  const parsed = parseDay(date);
  const count = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0)).getUTCDate();
  return Array.from({ length: count }, (_, day) => `${date.slice(0, 7)}-${String(day + 1).padStart(2, "0")}`).reduce((sum, day) => sum + dayMinutes(scheduleOn(employee, day)), 0);
}
const csvCell = (value: string) => `"${(/^[=+@\-\t\r\n]/.test(value) ? "'" : "") + value.replace(/"/g, '""')}"`;
export function scheduleCsv(employees: Employee[], dates: string[]) {
  const rows = [["Pracownik", "Data", "Od", "Do", "Minuty pracy"]];
  for (const employee of employees) for (const date of dates) {
    const day = scheduleOn(employee, date);
    rows.push([employee.name, date, day.enabled ? day.start : "Wolne", day.enabled ? day.end : "", String(dayMinutes(day))]);
  }
  return "\uFEFF" + rows.map(row => row.map(csvCell).join(";")).join("\r\n");
}
