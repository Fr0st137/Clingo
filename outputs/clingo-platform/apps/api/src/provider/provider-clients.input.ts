import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { revisionInput, textInput } from "./provider.input";

export type ClientInput = { name: string; email: string; phone: string; street: string; postalCode: string; city: string; notes: string };
export function clientInput(value: unknown, updating = false): ClientInput & { revision?: number } {
  const input = objectInput(value);
  const fields = ["name", "email", "phone", "street", "postalCode", "city", "notes", ...(updating ? ["revision"] : [])];
  if (Object.keys(input).some(key => !fields.includes(key))) throw new BadRequestException("Nieznane pole formularza.");
  const name = textInput(input.name, "imię i nazwisko lub nazwa", 180, true);
  const email = textInput(input.email, "e-mail", 320).toLowerCase();
  const phone = textInput(input.phone, "telefon", 40);
  const street = textInput(input.street, "ulica i numer", 240);
  const postalCode = textInput(input.postalCode, "kod pocztowy", 20);
  const city = textInput(input.city, "miejscowość", 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException("Wpisz poprawny adres e-mail.");
  if (phone && (!/^\+?[\d ()-]{7,40}$/.test(phone) || phone.replace(/\D/g, "").length < 7)) throw new BadRequestException("Wpisz poprawny numer telefonu.");
  if (typeof input.notes !== "string" || input.notes.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(input.notes)) throw new BadRequestException("Notatka może zawierać maksymalnie 2000 znaków.");
  return { name, email, phone, street, postalCode, city, notes: input.notes.trim(), ...(updating ? { revision: revisionInput(input.revision) } : {}) };
}
