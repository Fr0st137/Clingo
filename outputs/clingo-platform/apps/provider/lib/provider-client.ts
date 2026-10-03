export type WorkDay = { day: number; enabled: boolean; start: string; end: string };
export type EmployeeDraft = { name: string; email: string; phone: string; showInCalendar: boolean; services: string[]; schedule: WorkDay[] };
export type Employee = EmployeeDraft & { id: string; revision: number };
export type ProviderContext = { user: { name: string; email: string }; account: { id: string; name: string; role: "owner" | "admin" | "employee" } | null };
export const dayNames = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
export const services = [{ id: "homes", label: "Mieszkań i domów" }, { id: "offices", label: "Biur i lokali użytkowych" }];
export const newEmployee = (): EmployeeDraft => ({ name: "", email: "", phone: "", showInCalendar: true, services: [], schedule: [1, 2, 3, 4, 5, 6, 0].map(day => ({ day, enabled: false, start: "08:00", end: "16:00" })) });
export const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const dayMinutes = (day: WorkDay) => day.enabled ? Math.max(0, minutes(day.end) - minutes(day.start)) : 0;
export const hoursLabel = (value: number) => `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}min` : ""}`;
export const weekMinutes = (employee: EmployeeDraft) => employee.schedule.reduce((sum, day) => sum + dayMinutes(day), 0);
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
export const normalized = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");

export function loginDestination(next: string | null, origin: string) {
  if (!next?.startsWith("/") || next.startsWith("//") || /[\\\x00-\x1f\x7f]/.test(next)) return "/employees";
  try {
    const target = new URL(next, origin);
    if (target.origin === origin && target.pathname !== "/login") return target.pathname + target.search + target.hash;
  } catch { /* Invalid return links use the employee list. */ }
  return "/employees";
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function providerApi<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/provider/${path}`, { method, cache: "no-store", signal, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError("Nie można połączyć się z serwerem. Spróbuj ponownie.", 503);
  }
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    throw new ApiError(typeof data.message === "string" ? data.message : "Nie udało się wykonać operacji.", response.status);
  }
  return data;
}
