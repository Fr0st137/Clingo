import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { revisionInput, textInput } from "./provider.input";
export type ProviderLocation = { street: string; postalCode: string; city: string; radiusKm: number };
export function locationInput(value: unknown): ProviderLocation & { revision: number } {
  const input = objectInput(value);
  if (Object.keys(input).some(key => !["street", "postalCode", "city", "radiusKm", "revision"].includes(key))) throw new BadRequestException("Nieznane pole formularza.");
  const street = textInput(input.street, "ulica i numer", 240, true);
  const city = textInput(input.city, "miejscowość", 120, true);
  const postalCode = textInput(input.postalCode, "kod pocztowy", 6, true);
  if (!/^\d{2}-\d{3}$/.test(postalCode)) throw new BadRequestException("Podaj kod pocztowy w formacie 00-000.");
  if (!Number.isInteger(input.radiusKm) || (input.radiusKm as number) < 0 || (input.radiusKm as number) > 100) throw new BadRequestException("Zasięg musi wynosić od 0 do 100 km.");
  return { street, city, postalCode, radiusKm: input.radiusKm as number, revision: revisionInput(input.revision) };
}
