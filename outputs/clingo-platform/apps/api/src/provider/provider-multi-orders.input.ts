import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { revisionInput } from "./provider.input";

export function multiOrderActionInput(value: unknown) {
  const input = objectInput(value);
  if (Object.keys(input).some(key => !["action", "revision"].includes(key))) throw new BadRequestException("Nieznane pole formularza.");
  if (input.action !== "accept" && input.action !== "reject") throw new BadRequestException("Wybierz poprawną akcję dla zlecenia.");
  return { action: input.action, revision: revisionInput(input.revision) } as const;
}
