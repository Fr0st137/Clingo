import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { revisionInput, textInput } from "./provider.input";

export type ProviderContact = { name: string; legalName: string; phone: string; contactName: string; contactPhone: string; contactEmail: string };
export type NotificationChannel = { created: boolean; changed: boolean; cancelled: boolean; marketing: boolean };
export type ProviderNotifications = { email: NotificationChannel; sms: NotificationChannel };
export const emptyNotifications = (): ProviderNotifications => ({
  email: { created: false, changed: false, cancelled: false, marketing: false },
  sms: { created: false, changed: false, cancelled: false, marketing: false }
});

function onlyKeys(input: Record<string, unknown>, keys: string[]) {
  if (Object.keys(input).some(key => !keys.includes(key))) throw new BadRequestException("Formularz zawiera nieznane pole.");
}
export function contactInput(value: unknown): ProviderContact & { revision: number } {
  const input = objectInput(value);
  onlyKeys(input, ["name", "legalName", "phone", "contactName", "contactPhone", "contactEmail", "revision"]);
  const result = {
    name: textInput(input.name, "nazwa działalności", 180, true),
    legalName: textInput(input.legalName, "pełna nazwa działalności", 180),
    phone: textInput(input.phone, "telefon działalności", 40),
    contactName: textInput(input.contactName, "osoba kontaktowa", 180),
    contactPhone: textInput(input.contactPhone, "telefon osoby kontaktowej", 40),
    contactEmail: textInput(input.contactEmail, "e-mail osoby kontaktowej", 320).toLowerCase(),
    revision: revisionInput(input.revision)
  };
  for (const phone of [result.phone, result.contactPhone]) {
    if (phone && !/^\+?[\d ()-]{7,40}$/.test(phone)) throw new BadRequestException("Wpisz poprawny numer telefonu.");
  }
  if (result.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.contactEmail)) throw new BadRequestException("Wpisz poprawny e-mail osoby kontaktowej.");
  return result;
}
export function notificationsInput(value: unknown): { notifications: ProviderNotifications; revision: number } {
  const input = objectInput(value);
  onlyKeys(input, ["email", "sms", "revision"]);
  const parse = (value: unknown): NotificationChannel => {
    const input = objectInput(value);
    const keys = ["created", "changed", "cancelled", "marketing"];
    onlyKeys(input, keys);
    if (keys.some(key => typeof input[key] !== "boolean")) throw new BadRequestException("Wybierz ustawienia dla wszystkich rodzajów powiadomień.");
    return { created: input.created as boolean, changed: input.changed as boolean, cancelled: input.cancelled as boolean, marketing: input.marketing as boolean };
  };
  return { notifications: { email: parse(input.email), sms: parse(input.sms) }, revision: revisionInput(input.revision) };
}
