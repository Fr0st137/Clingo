import { BadRequestException } from "@nestjs/common";

export type ProjectCompletion = { at: string; actor: string; releasedSessionIds: string[] };
export function projectCompletionInput(input: Record<string,unknown>) {
  if (Object.keys(input).some(key=>!["revision","confirmCompletion"].includes(key)) || !Number.isSafeInteger(input.revision) || Number(input.revision)<1 || input.confirmCompletion!==true) throw new BadRequestException("Potwierdź wykonanie całego projektu i zwolnienie przyszłych sesji.");
  return { revision:Number(input.revision) };
}
export function projectCompletion(sessions: Array<{id:string;startsAt:Date}>, actor:string, now=new Date()): ProjectCompletion {
  return {at:now.toISOString(),actor,releasedSessionIds:sessions.filter(row=>+row.startsAt>+now).map(row=>row.id)};
}
