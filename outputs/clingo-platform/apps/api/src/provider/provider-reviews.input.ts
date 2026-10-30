import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { revisionInput } from "./provider.input";

export function reviewReportInput(value: unknown) {
  const input = objectInput(value);
  if (Object.keys(input).some(key => !["reported", "revision", "source", "updatedAt"].includes(key))) throw new BadRequestException("Nieznane pole formularza.");
  if(input.source!==undefined&&input.source!=="customer"&&input.source!=="legacy")throw new BadRequestException("Nieprawidłowe źródło opinii.");
  if(input.source==="customer"&&(typeof input.updatedAt!=="string"||!Number.isFinite(Date.parse(input.updatedAt))||new Date(input.updatedAt).toISOString()!==input.updatedAt))throw new BadRequestException("Wczytaj aktualną wersję opinii.");
  if (typeof input.reported !== "boolean") throw new BadRequestException("Wybierz poprawny stan zgłoszenia.");
  return { reported: input.reported, revision: revisionInput(input.revision),...(input.source===undefined?{}:{source:input.source as "customer"|"legacy"}),...(input.source==="customer"?{updatedAt:input.updatedAt as string}:{}) };
}
