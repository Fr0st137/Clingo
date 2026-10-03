import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { revisionInput } from "./provider.input";

export function reviewReportInput(value: unknown) {
  const input = objectInput(value);
  if (Object.keys(input).some(key => !["reported", "revision"].includes(key))) throw new BadRequestException("Nieznane pole formularza.");
  if (typeof input.reported !== "boolean") throw new BadRequestException("Wybierz poprawny stan zgłoszenia.");
  return { reported: input.reported, revision: revisionInput(input.revision) };
}
