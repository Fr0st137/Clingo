import { BadRequestException, ConflictException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { addLocalDays, bookingLimit, localDate, localTime, warsawDate } from "../dashboard/booking";
import { assignStaff, type AssignedEmployee, type Staffing } from "../dashboard/staffing";
import { MAX_BOOKING_SESSIONS } from "../dashboard/booking-policy";
import { estimateForArea, projectBalance, type ProjectEstimate } from "./project-work";

export type ProjectSession = { id: string; startsAt: Date; endsAt: Date; employees: AssignedEmployee[]; workers: number; priceMinor: number };
export const sameCrew = (first: string[], second: string[]) => first.length === second.length && [...first].sort().every((id,index) => id === [...second].sort()[index]);
export const sameSession = (first: ProjectSession, second: ProjectSession) => +first.startsAt === +second.startsAt && +first.endsAt === +second.endsAt && sameCrew(first.employees.map(row=>row.id),second.employees.map(row=>row.id));

export function projectInterval(value: Record<string, unknown>) {
  const date = value.date;
  if (typeof date !== "string" || !/^20\d{2}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date || !Number.isInteger(value.startMinute) || !Number.isInteger(value.endMinute) || Number(value.startMinute)<0 || Number(value.endMinute)>1440 || Number(value.endMinute)<=Number(value.startMinute)) throw new BadRequestException("Wybierz poprawny dzień i godziny sesji w tym samym dniu.");
  const time = (minute: number) => `${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`;
  const endDate=value.endMinute===1440?addLocalDays(date,1):date,endTime=value.endMinute===1440?"00:00":time(Number(value.endMinute));
  const startsAt = warsawDate(date,time(Number(value.startMinute))), endsAt = warsawDate(endDate,endTime);
  if (localDate(startsAt)!==date || localTime(startsAt)!==time(Number(value.startMinute)) || localDate(endsAt)!==endDate || localTime(endsAt)!==endTime || +endsAt<=+startsAt) throw new BadRequestException("Podana godzina nie istnieje w czasie polskim.");
  return { startsAt, endsAt };
}

export function validateProjectPlan(value: Record<string, unknown>, current: ProjectSession[], estimate: ProjectEstimate, staff: Staffing, bufferMinutes: number, now = new Date(), forceAvailability = false) {
  if (Object.keys(value).some(key=>!["revision","sessions","areaSquareMeters","confirmUnderplanned","confirmOverplanned"].includes(key)) || !Array.isArray(value.sessions) || value.sessions.length<1 || value.sessions.length>MAX_BOOKING_SESSIONS || [value.confirmUnderplanned,value.confirmOverplanned].some(flag=>flag!==undefined&&typeof flag!=="boolean")) throw new BadRequestException("Projekt musi zawierać od 1 do 186 sesji i poprawne potwierdzenia bilansu.");
  let nextEstimate: ProjectEstimate;
  try { nextEstimate = estimateForArea(estimate, value.areaSquareMeters===undefined ? estimate.areaSquareMeters : value.areaSquareMeters as number|null); } catch(error) { throw new BadRequestException((error as Error).message); }
  const originals = new Map(current.map(row=>[row.id,row])), seen = new Set<string>();
  const sessions = value.sessions.map((raw): ProjectSession => {
    if (!raw || typeof raw!=="object" || Array.isArray(raw)) throw new BadRequestException("Nieprawidłowa sesja.");
    const row=raw as Record<string,unknown>;
    if (Object.keys(row).some(key=>!["id","date","startMinute","endMinute","employeeIds"].includes(key)) || row.id!==undefined && (typeof row.id!=="string" || row.id.length>100) || !Array.isArray(row.employeeIds) || row.employeeIds.length>50 || row.employeeIds.some(id=>typeof id!=="string") || new Set(row.employeeIds).size!==row.employeeIds.length) throw new BadRequestException("Wybierz poprawną obsadę sesji.");
    const id = row.id as string || randomUUID(), original=originals.get(id), ids=row.employeeIds as string[];
    if (seen.has(id) || !original && !/^[a-f0-9-]{36}$/i.test(id)) throw new BadRequestException("Sesje mają nieprawidłowe lub powtórzone identyfikatory.");
    seen.add(id);
    const interval=projectInterval(row);
    const sameStart=!!original && +interval.startsAt===+original.startsAt, sameEnd=!!original && +interval.endsAt===+original.endsAt;
    const sameEmployees=!!original && sameCrew(ids,original.employees.map(row=>row.id));
    if (!forceAvailability && original && +original.endsAt<=+now && !(sameStart&&sameEnd&&sameEmployees)) throw new BadRequestException("Zakończonego terminu nie można zmienić ani usunąć.");
    if (!forceAvailability && original && +original.startsAt<=+now && +original.endsAt>+now && (!sameStart || !sameEmployees || +interval.endsAt<=+now)) throw new BadRequestException("W trwającej sesji możesz zmienić wyłącznie godzinę końcową na późniejszą niż teraz.");
    if ((!original || forceAvailability) && +interval.startsAt<=+now || original && +original.startsAt>+now && +interval.startsAt<=+now) throw new BadRequestException("Nowa data sesji musi przypadać w przyszłości.");
    if ((!original || !sameStart) && localDate(interval.startsAt)>bookingLimit(now)) throw new BadRequestException("Sesje można planować na sześć miesięcy do przodu.");
    if (+interval.endsAt>+now && !ids.length) throw new BadRequestException("Każda aktywna sesja musi mieć co najmniej jednego pracownika.");
    return { id,...interval,employees:ids.map(id=>({id,name:staff.employees.find(row=>row.id===id)?.name ?? original?.employees.find(row=>row.id===id)?.name ?? ""})),workers:ids.length||original?.workers||1,priceMinor:original?.priceMinor??0 };
  }).sort((a,b)=>+a.startsAt-+b.startsAt);
  for (const original of current) if (!forceAvailability && !seen.has(original.id) && +original.startsAt<=+now) throw new BadRequestException("Trwającej lub zakończonej sesji nie można usunąć.");
  for (let index=0;index<sessions.length;index++) {
    const row=sessions[index], original=originals.get(row.id), previous=sessions[index-1];
    if (previous && +row.startsAt<+previous.endsAt) throw new BadRequestException("Sesje jednego projektu nie mogą na siebie nachodzić.");
    if (previous && +row.startsAt<+previous.endsAt+bufferMinutes*60000 && !(original && sameSession(row,original) && originals.get(previous.id) && sameSession(previous,originals.get(previous.id)!))) throw new BadRequestException("Zachowaj bufor pomiędzy sesjami projektu.");
    // Existing reservations survive later absences; only a changed/new time needs new capacity.
    const unchanged=!forceAvailability&&original&&sameSession(row,original), shortenedActive=!forceAvailability&&original&&+original.startsAt<=+now&&+original.endsAt>+now&&+row.startsAt===+original.startsAt&&+row.endsAt<=+original.endsAt&&sameCrew(row.employees.map(row=>row.id),original.employees.map(row=>row.id));
    if (!unchanged && !shortenedActive && +row.endsAt>+now) {
      const checkStart=!forceAvailability&&original&&+original.startsAt<=+now ? original.endsAt : row.startsAt;
      try { row.employees=assignStaff(staff,checkStart,row.endsAt,row.workers,bufferMinutes,row.employees.map(row=>row.id)); }
      catch { throw new ConflictException("Obsada jednej z sesji jest już niedostępna. Odśwież dostępność i popraw harmonogram."); }
    } else staff.occupied.push({startsAt:row.startsAt,endsAt:row.endsAt,employeeIds:row.employees.length?row.employees.map(row=>row.id):null,bufferMinutes});
  }
  const balance=projectBalance(nextEstimate.requiredWorkMinutes,sessions.map(row=>({durationMinutes:(+row.endsAt-+row.startsAt)/60000,workers:row.workers})));
  if (balance.state==="shortage" && value.confirmUnderplanned!==true) throw new BadRequestException("Zaplanowano za mało roboczogodzin. Potwierdź realizację mimo niedoboru na własne ryzyko.");
  if (balance.state==="excess" && value.confirmOverplanned!==true) throw new BadRequestException("Zaplanowano nadmiar roboczogodzin. Potwierdź zapis nadmiaru.");
  return {sessions,estimate:nextEstimate,balance};
}

export function allocateProjectPrice(total: number, sessions: ProjectSession[], originals: ProjectSession[], now=new Date()) {
  const fixed=new Map(originals.filter(row=>+row.endsAt<=+now).map(row=>[row.id,row.priceMinor]));
  const free=sessions.filter(row=>!fixed.has(row.id)), remaining=Math.max(0,total-[...fixed.values()].reduce((sum,value)=>sum+value,0));
  const base=Math.floor(remaining/Math.max(1,free.length)), remainder=remaining%Math.max(1,free.length);
  let index=0;return sessions.map(row=>({...row,priceMinor:fixed.has(row.id)?fixed.get(row.id)!:base+(index++<remainder?1:0)}));
}
