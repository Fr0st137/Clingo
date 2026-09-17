import Link from "next/link";
import type { OrderCardData } from "./order-card";
import { ScheduleSessionCard } from "./schedule-session-card";
import { bookingTime } from "../lib/booking-client";

export function OrderSessionTimeline({ order, canReschedule }: { order: OrderCardData; canReschedule: boolean }) {
  const sessions = (order.bookingDetails?.sessions ?? []).map((session, index) => ({ ...session, originalIndex: index }))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const now = Date.now();
  return <section aria-label="Harmonogram sesji" className="min-w-0">
    {sessions.length ? <ol className="relative m-0 grid list-none gap-[30px] p-0 sm:gap-[51px]">
      {sessions.map((session, index) => {
        const date = new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(session.startsAt));
        const minutes = Math.round((Date.parse(session.endsAt) - Date.parse(session.startsAt)) / 60000);
        const duration = `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h` : ""}${minutes % 60 ? `${minutes >= 60 ? " " : ""}${minutes % 60}min` : ""}`;
        const title = `Sesja ${index + 1}${index === 0 ? " (start)" : index === sessions.length - 1 ? " (koniec)" : ""}`;
        return <li key={`${session.startsAt}-${session.originalIndex}`} className="relative grid min-w-0 grid-cols-[20px_minmax(0,1fr)] gap-x-[10px] sm:grid-cols-[90px_36px_minmax(0,1fr)]">
          <time dateTime={session.startsAt} className="col-start-2 mb-[10px] w-fit rounded-[10px] border border-[#e5e7eb] bg-white px-[8px] py-[10px] text-[14px] leading-5 text-[#7c8691] sm:col-start-1 sm:mb-0 sm:mt-[15px] sm:self-start">{date}</time>
          <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-[20px] sm:left-[100px] sm:w-[36px]">
            <span className={`absolute left-1/2 top-0 w-[2px] -translate-x-1/2 bg-[#e5e7eb] ${index === sessions.length - 1 ? "bottom-0" : "bottom-[-30px] sm:bottom-[-51px]"}`} />
            <img alt="" src="/figma-assets/schedule-timeline-dot.svg" width={16} height={16} className="absolute left-1/2 top-[20px] h-[36px] w-[16px] -translate-x-1/2 bg-white py-[10px]" />
          </span>
          <div className="col-start-2 sm:col-start-3"><ScheduleSessionCard saved title={title} duration={duration} workers={`${session.workers} ${session.workers === 1 ? "pracownik" : "pracowników"}`} start={bookingTime(session.startsAt)} end={bookingTime(session.endsAt)}
            actions={canReschedule && Date.parse(session.startsAt) > now ? <Link aria-label={`Przełóż sesję ${index + 1}`} href={`/zamowienia/przeloz?id=${encodeURIComponent(order.id!)}&session=${session.originalIndex}`} className="shrink-0 rounded-full border border-[#e5e7eb] bg-[#f4f6f9] px-[20px] py-[12px] text-[14px] leading-[17px] text-[#2e3b4c] hover:bg-[#e6edf3]">Przełóż sesję</Link> : undefined} />
          </div>
        </li>;
      })}
    </ol> : <p className="m-0 rounded-[15px] border border-[#e5e7eb] p-[15px] text-[#7c8691]">Brak zapisanego harmonogramu spotkań.</p>}
  </section>;
}
