import type { CSSProperties } from "react";
import Link from "next/link";

export type CalendarAppointment = {
  id?: string;
  start: string;
  end: string;
  client: string;
  service?: string;
  detail?: string;
  top: number;
  height: number;
  status: "confirmed" | "muted" | "none" | "pending";
  address?: string;
  employeeAvatar?: string;
  compact?: "30" | "45" | "60";
};

export function ProviderCalendarAppointment({ appointment, variant = "week" }: { appointment: CalendarAppointment; variant?: "week" | "day" }) {
  return appointment.id ? <Link href={`/orders/${appointment.id}/edit`} className="calendar-order-edit-link" aria-label={`Edytuj zamówienie: ${appointment.client}, ${appointment.start}–${appointment.end}`}><CalendarAppointmentCard appointment={appointment} variant={variant} /></Link> : <CalendarAppointmentCard appointment={appointment} variant={variant} />;
}

function CalendarAppointmentCard({ appointment, variant }: { appointment: CalendarAppointment; variant: "week" | "day" }) {
  const { status, compact } = appointment;
  if (variant === "day") {
    return <article className={`calendar-appointment is-day${status === "muted" ? " is-day-muted" : ""}`} style={{ top: appointment.top, height: appointment.height }} aria-label={`${appointment.start}–${appointment.end}, ${appointment.client}`}><div className="day-appointment-header"><div className="calendar-appointment-time"><span>{appointment.start}</span><img className="calendar-appointment-arrow" src="/figma-assets/calendar/day/time-arrow.svg" alt="do" /><span>{appointment.end}</span>{status === "pending" ? <img className="day-appointment-pending" src="/figma-assets/calendar/day/pending.svg" alt="Oczekujące" /> : null}</div>{appointment.employeeAvatar ? <img className="day-appointment-avatar" src={appointment.employeeAvatar} alt="Przypisany pracownik" /> : null}</div><div className="calendar-appointment-client">{appointment.client}</div>{appointment.service ? <div className="day-appointment-service">{appointment.service}{appointment.detail ? <> · {appointment.detail}</> : null}</div> : null}{appointment.address ? <div className="day-appointment-address"><img src="/figma-assets/calendar/day/map.svg" alt="" />{appointment.address}</div> : null}</article>;
  }
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
