import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { revisionInput, textInput } from "./provider.input";
import type { ManualDiscount, ManualPosition } from "./manual-project-pricing";
import { MAX_BOOKING_SESSIONS } from "../dashboard/booking-policy";

export function manualProjectInput(value: unknown) {
  const input = objectInput(value);
  const allowed = ["requestId", "clientId", "offerId", "offerRevision", "areaSquareMeters", "basePriceMinor", "quantities", "positions", "discount", "address", "notes", "sessions", "confirmUnderplanned", "confirmOverplanned", "confirmUnderstaffing"];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new BadRequestException("Nieznane pole zlecenia wielosesyjnego.");
  const uuid = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
  if (!uuid(input.requestId) || !uuid(input.clientId) || !uuid(input.offerId)) throw new BadRequestException("Wybierz klienta i usługę oraz poprawny identyfikator formularza.");
  if (!Array.isArray(input.sessions) || input.sessions.length < 2 || input.sessions.length > MAX_BOOKING_SESSIONS) throw new BadRequestException("Dodaj od 2 do 186 sesji zlecenia.");
  if ([input.confirmUnderplanned, input.confirmOverplanned, input.confirmUnderstaffing].some(flag => flag !== undefined && typeof flag !== "boolean")) throw new BadRequestException("Nieprawidłowe potwierdzenie bilansu lub obsady.");
  const notes = input.notes;
  if (typeof notes !== "string" || notes.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(notes)) throw new BadRequestException("Notatki mogą zawierać maksymalnie 2000 znaków.");
  const quantities = objectInput(input.quantities), discount = objectInput(input.discount);
  if (Object.keys(discount).some(key => !["mode", "value"].includes(key)) || typeof discount.value !== "string" || discount.value.length > 12 || !["percent", "amount"].includes(discount.mode as string)) throw new BadRequestException("Nieprawidłowy rabat.");
  if (!Array.isArray(input.positions) || input.positions.length > 20) throw new BadRequestException("Możesz dodać maksymalnie 20 własnych pozycji.");
  const positions = input.positions.map(raw => {
    const row = objectInput(raw);
    if (Object.keys(row).some(key => !["id", "title", "quantity", "price"].includes(key)) || ["id", "title", "quantity", "price"].some(key => typeof row[key] !== "string") || String(row.id).length > 100 || String(row.title).length > 180 || String(row.quantity).length > 8 || String(row.price).length > 12) throw new BadRequestException("Nieprawidłowa dodatkowa pozycja.");
    return { id: row.id as string, title: row.title as string, quantity: row.quantity as string, price: row.price as string } satisfies ManualPosition;
  });
  return { requestId: input.requestId.toLowerCase(), clientId: input.clientId.toLowerCase(), offerId: input.offerId.toLowerCase(), offerRevision: revisionInput(input.offerRevision), areaSquareMeters: input.areaSquareMeters as number,
    ...(input.basePriceMinor === undefined ? {} : { basePriceMinor: input.basePriceMinor as number }), quantities: quantities as Record<string, number>, positions, discount: discount as ManualDiscount,
    address: textInput(input.address, "adres", 420, true), notes: notes.trim(), sessions: input.sessions,
    confirmUnderplanned: input.confirmUnderplanned === true, confirmOverplanned: input.confirmOverplanned === true, confirmUnderstaffing: input.confirmUnderstaffing === true };
}
