import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";

export type WorkDay = { day: number; enabled: boolean; start: string; end: string };
export type EmployeeInput = { name: string; email: string; phone: string; showInCalendar: boolean; services: string[]; schedule: WorkDay[] };

export function textInput(value: unknown, label: string, max: number, required = false) {
  if (typeof value !== "string" || value.length > max || /[\x00-\x1f\x7f]/.test(value) || (required && !value.trim())) {
    throw new BadRequestException(`Nieprawidłowe pole: ${label}.`);
  }
  return value.trim();
}
export function revisionInput(value: unknown) {
  if (!Number.isSafeInteger(value) || (value as number) < 1) throw new BadRequestException("Brak poprawnej wersji danych. Odśwież formularz.");
  return value as number;
}
export function employeeInput(value: unknown): EmployeeInput {
  const input = objectInput(value);
  const allowed = ["name", "email", "phone", "showInCalendar", "services", "schedule", "revision"];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new BadRequestException("Nieznane pole formularza.");
  const name = textInput(input.name, "imię i nazwisko", 180, true);
  const email = textInput(input.email, "e-mail", 320).toLowerCase();
  const phone = textInput(input.phone, "telefon", 40);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException("Wpisz poprawny adres e-mail.");
  if (phone && !/^\+?[\d ()-]{7,40}$/.test(phone)) throw new BadRequestException("Wpisz poprawny numer telefonu.");
  if (typeof input.showInCalendar !== "boolean") throw new BadRequestException("Wybierz widoczność w kalendarzu.");
  if (!Array.isArray(input.services) || input.services.length > 2 || new Set(input.services).size !== input.services.length || input.services.some(service => !["homes", "offices"].includes(service))) {
    throw new BadRequestException("Wybierz poprawne rodzaje usług.");
  }
  if (!Array.isArray(input.schedule) || input.schedule.length !== 7) throw new BadRequestException("Grafik musi zawierać siedem dni tygodnia.");
  const seen = new Set<number>();
  const schedule = input.schedule.map(value => {
    const day = objectInput(value);
    if (Object.keys(day).some(key => !["day", "enabled", "start", "end"].includes(key)) || !Number.isInteger(day.day) || (day.day as number) < 0 || (day.day as number) > 6 || seen.has(day.day as number) || typeof day.enabled !== "boolean") {
      throw new BadRequestException("Nieprawidłowe dni w grafiku.");
    }
    seen.add(day.day as number);
    const validTime = (time: unknown): time is string => typeof time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
    if (!validTime(day.start) || !validTime(day.end) || day.end <= day.start) throw new BadRequestException("Koniec pracy musi być późniejszy niż początek, w tym samym dniu.");
    return { day: day.day as number, enabled: day.enabled, start: day.start, end: day.end };
  });
  return { name, email, phone, showInCalendar: input.showInCalendar, services: input.services, schedule };
}
