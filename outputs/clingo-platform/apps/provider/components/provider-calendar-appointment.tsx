import type { CSSProperties } from "react";

export type CalendarAppointment = {
  start: string;
  end: string;
  client: string;
  service?: string;
  detail?: string;
  top: number;
  height: number;
  status: "confirmed" | "muted" | "none";
  compact?: "30" | "45" | "60";
};

export function ProviderCalendarAppointment({ appointment }: { appointment: CalendarAppointment }) {
  const { status, compact } = appointment;
  return (
    <article className={`calendar-appointment${status === "muted" ? " is-muted" : ""}${compact ? ` is-compact-${compact}` : ""}`} style={{ top: appointment.top, height: appointment.height } as CSSProperties} aria-label={`${appointment.start}–${appointment.end}, ${appointment.client}`}>
      <div className="calendar-appointment-copy">
        <div className="calendar-appointment-time"><span>{appointment.start}</span><img className="calendar-appointment-arrow" src="/figma-assets/calendar/week/time-arrow.svg" alt="do" /><span>{appointment.end}</span>{status !== "none" ? <span className="calendar-appointment-status"><img src={`/figma-assets/calendar/week/${status === "muted" ? "status-muted.svg" : "status.svg"}`} alt="" /></span> : null}</div>
        {compact !== "30" ? <span className="calendar-appointment-client">{appointment.client}</span> : null}
        {appointment.service ? <div className="calendar-appointment-service"><span>{appointment.service}</span>{appointment.detail ? <span>{appointment.detail}</span> : null}</div> : null}
      </div>
    </article>
  );
}
