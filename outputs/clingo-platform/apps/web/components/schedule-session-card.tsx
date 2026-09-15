import type { ReactNode } from "react";

type Props = { title: string; duration: string; workers: string; start: string; end: string; actions?: ReactNode; saved?: boolean };

export function ScheduleSessionCard({ title, duration, workers, start, end, actions, saved = false }: Props) {
  return <article className={`flex min-h-[82px] min-w-0 flex-wrap items-center justify-between gap-[15px] rounded-[15px] border border-[#e5e7eb] bg-white p-[15px] ${saved ? "" : "shadow-[0_4px_14px_rgba(0,0,0,0.04)]"}`}>
    <div className="grid min-w-0 gap-[10px] px-[10px]">
      <div className={`flex min-w-0 flex-wrap items-center ${saved ? "gap-[15px]" : "gap-[10px]"}`}>
        <h3 className="m-0 text-[14px] font-medium leading-5 text-[#2e3b4c]">{title}</h3>
        <span className={`rounded-[30px] bg-[#f0f2f4] px-[10px] py-[3px] leading-4 text-[#7c8691] ${saved ? "text-[13px]" : "text-[12px]"}`}>{duration}</span>
        <span className="flex items-center gap-[5px] text-[13px] leading-4 text-[#7c8691]">
          <img alt="" className="h-[13px] w-[13px]" src="/figma-assets/schedule-user.svg" />{workers}
        </span>
      </div>
      <div className="flex items-center gap-[10px] text-[14px] leading-5 text-[#2e3b4c]">
        <img alt="" className="h-[12px] w-[12px]" src="/figma-assets/schedule-pending.svg" />
        <span>{start}</span><img alt="" className="h-[14px] w-[14px]" src="/figma-assets/schedule-arrow-right.svg" /><span>{end}</span>
      </div>
    </div>
    {actions}
  </article>;
}
