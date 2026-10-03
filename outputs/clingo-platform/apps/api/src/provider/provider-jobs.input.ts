import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { revisionInput, textInput } from "./provider.input";
export type JobInput = { clientId: string; offerId: string; employeeId: string | null; date: string; startMinute: number; durationMinutes: number; priceMinor: number; notes: string; status: "scheduled" | "completed" | "cancelled" };
export function jobInput(value: unknown, updating = false): JobInput & { revision?: number } {
  const input = objectInput(value);
  if (Object.keys(input).some(key => !["clientId", "offerId", "employeeId", "date", "startMinute", "durationMinutes", "priceMinor", "notes", "status", ...(updating ? ["revision"] : [])].includes(key))) throw new BadRequestException("Nieznane pole zlecenia.");
  const uuid = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
  if (!uuid(input.clientId) || !uuid(input.offerId) || (input.employeeId !== null && !uuid(input.employeeId))) throw new BadRequestException("Wybierz klienta, usługę i poprawne przypisanie pracownika.");
  const date = textInput(input.date, "data", 10, true);
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date + "T12:00:00Z")) || new Date(date + "T12:00:00Z").toISOString().slice(0,10) !== date) throw new BadRequestException("Podaj poprawną datę w latach 2000–2099.");
  if (!Number.isInteger(input.startMinute) || (input.startMinute as number) < 0 || (input.startMinute as number) > 1439 || !Number.isInteger(input.durationMinutes) || (input.durationMinutes as number) < 15 || (input.durationMinutes as number) > 1440 || (input.startMinute as number) + (input.durationMinutes as number) > 1440) throw new BadRequestException("Zlecenie musi trwać co najmniej 15 minut i kończyć się w tym samym dniu.");
  if (!Number.isSafeInteger(input.priceMinor) || (input.priceMinor as number) < 1 || (input.priceMinor as number) > 10000000) throw new BadRequestException("Kwota musi wynosić od 0,01 do 100 000 zł.");
  if (typeof input.notes !== "string" || input.notes.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(input.notes)) throw new BadRequestException("Notatki mogą zawierać maksymalnie 2000 znaków.");
  if (input.status !== "scheduled" && !(updating && ["completed", "cancelled"].includes(input.status as string))) throw new BadRequestException("Nieprawidłowy status zlecenia.");
  return { clientId: input.clientId, offerId: input.offerId, employeeId: input.employeeId, date, startMinute: input.startMinute as number, durationMinutes: input.durationMinutes as number, priceMinor: input.priceMinor as number, notes: input.notes.trim(), status: input.status as JobInput["status"], ...(updating ? { revision: revisionInput(input.revision) } : {}) };
}
