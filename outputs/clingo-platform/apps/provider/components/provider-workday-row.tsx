import { ProviderToggle } from "./provider-toggle";

export type WorkDay = { day: string; start: string; end: string; disabled?: boolean };

export const employeeWorkDays: ReadonlyArray<WorkDay> = [
  { day: "Poniedziałek", start: "08:00", end: "20:00" },
  { day: "Wtorek", start: "08:00", end: "20:00" },
  { day: "Środa", start: "08:00", end: "20:00" },
  { day: "Czwartek", start: "08:00", end: "20:00" },
  { day: "Piątek", start: "08:00", end: "20:00" },
  { day: "Sobota", start: "08:00", end: "20:00" },
  { day: "Niedziela", start: "08:00", end: "16:00", disabled: true }
];

function WorkdayTime({ day, value, edge, disabled }: { day: string; value: string; edge: "Początek" | "Koniec"; disabled?: boolean }) {
  return <button type="button" disabled aria-label={`${edge} pracy — ${day}: ${value}`}>{value}<img src={`/figma-assets/employees/add/time-chevron${disabled ? "-disabled" : ""}.svg`} alt="" /></button>;
}

export function ProviderWorkdayRow({ day, start, end, disabled, configure = false }: WorkDay & { configure?: boolean }) {
  return (
    <div className={`workday-row${disabled ? " is-disabled" : ""}${configure ? " is-configure" : ""}`}>
      <div className="workday-label">{configure ? <ProviderToggle label={`Dostępność — ${day}`} checked={!disabled} /> : null}<span className="workday-name">{day}</span></div>
      <div className="workday-hours">{configure ? <WorkdayTime day={day} value={start} edge="Początek" disabled={disabled} /> : <span>{start}</span>}<i />{configure ? <WorkdayTime day={day} value={end} edge="Koniec" disabled={disabled} /> : <span>{end}</span>}</div>
      <div className="workday-total"><span>8h</span></div>
    </div>
  );
}
