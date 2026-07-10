"use client";

import { FilterGroupData } from "../lib/public-mock-data";

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex h-[45px] w-[315px] items-center rounded-[20px] bg-[#f4f6f9] px-[20px]">
      <img alt="" className="h-[16px] w-[16px]" src={icon} />
      <span className="ml-[20px] text-[14px] font-normal leading-[17px] text-[#2e3b4c]">{title}</span>
    </div>
  );
}

function EmptyCheck() {
  return <span className="h-[16px] w-[16px] rounded-[3px] border border-[#9ca3af] bg-white" />;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex h-[16px] w-[90px] items-center text-[14px] leading-none">
      {Array.from({ length: 5 }).map((_, index) => (
        <span className={index < count ? "text-[#fbbf24]" : "text-[#e5e7eb]"} key={index}>
          ★
        </span>
      ))}
    </span>
  );
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <span className={`flex h-[24px] w-[50px] items-center rounded-[30px] p-[3px] ${enabled ? "justify-end bg-[#0079de]" : "bg-[#e5e7eb]"}`}>
      <img alt="" className="h-[18px] w-[18px]" src="/figma-assets/board-toggle-knob.svg" />
    </span>
  );
}

export function BoardFilters({ groups }: { groups: FilterGroupData[] }) {
  const [rating, price, type, facilities, orders] = groups;

  return (
    <aside
      className="h-[916px] w-[345px] rounded-[20px] border border-[#e6edf3] bg-white shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]"
      data-node-id="1141:1456"
    >
      <div className="mx-[15px] mt-[15px] h-[205px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-review.svg" title={rating.title} />
        <div className="mt-[10px] grid gap-[10px]">
          {rating.options.map((option) => (
            <button className="flex h-[22px] w-[315px] items-center px-[15px]" key={option} type="button">
              <EmptyCheck />
              <span className="ml-[15px] w-[9px] text-left text-[12px] font-normal leading-3 text-[#2e3b4c]">{option}</span>
              <span className="ml-[15px]">
                <Stars count={Number(option)} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <button className="mx-[15px] mt-[30px] flex h-[45px] w-[315px] items-center rounded-[50px] bg-[#f4f6f9] px-[20px]" type="button">
        <img alt="" className="h-[16px] w-[16px]" src="/figma-assets/board-shield.svg" />
        <span className="ml-[20px] text-[14px] font-medium leading-normal text-[#2e3b4c]">Usługi dodatkowe</span>
        <span className="ml-[20px] flex h-[20px] w-[40px] items-center justify-center rounded-[20px] bg-[#0079de] text-center text-[14px] font-medium leading-normal text-white">
          2
        </span>
        <span className="flex-1" />
        <img alt="" className="h-[16px] w-[15px] -rotate-90" src="/figma-assets/board-chevron.svg" />
      </button>

      <div className="mx-[15px] mt-[30px] h-[92px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-coins.svg" title={price.title} />
        <div className="mt-[10px] flex h-[37px] w-[315px] items-center">
          <button className="h-[37px] w-[149px] rounded-[30px] border border-[#e5e7eb] text-[14px] leading-[17px] text-[#9ca3af]" type="button">
            od
          </button>
          <span className="w-[17px] text-center text-[14px] text-[#9ca3af]">-</span>
          <button className="h-[37px] w-[149px] rounded-[30px] border border-[#e5e7eb] text-[14px] leading-[17px] text-[#9ca3af]" type="button">
            do
          </button>
        </div>
      </div>

      <div className="mx-[15px] mt-[30px] h-[113px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-choose.svg" title={type.title} />
        <div className="mt-[10px] grid gap-[10px]">
          {type.options.map((option) => (
            <div className="flex h-[24px] w-[315px] items-center px-[15px]" key={option}>
              <Toggle enabled />
              <span className="ml-[20px] text-[14px] leading-[17px] text-[#2e3b4c]">{option}</span>
              <img alt="" className="ml-[10px] h-[14px] w-[14px]" src="/figma-assets/board-info.svg" />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-[15px] mt-[30px] h-[111px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-terms.svg" title={facilities.title} />
        <div className="mt-[10px] grid gap-[10px]">
          {facilities.options.map((option) => (
            <button className="flex h-[23px] w-[315px] items-center px-[15px]" key={option} type="button">
              <EmptyCheck />
              <span className="ml-[20px] text-[14px] leading-[17px] text-[#2e3b4c]">{option}</span>
              <img alt="" className="ml-[10px] h-[14px] w-[14px]" src="/figma-assets/board-info.svg" />
            </button>
          ))}
        </div>
      </div>

      <div className="mx-[15px] mt-[30px] h-[95px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-shield.svg" title={orders.title} />
        <div className="mt-[10px] flex h-[40px] w-[315px] items-center px-[15px]">
          <span className="flex h-[30px] w-[46px] items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[12px] leading-5 text-[#2e3b4c]">27</span>
          <span className="relative ml-[5px] h-[6px] w-[206px] rounded-[10px] bg-[#e5e7eb]">
            <span className="absolute left-0 top-0 h-[6px] w-[60px] rounded-[10px] bg-[#0079de]" />
            <span className="absolute left-[52px] top-[-5px] h-[16px] w-[16px] rounded-full bg-[#0079de]" />
          </span>
          <span className="ml-[5px] text-[12px] leading-5 text-[#9ca3af]">166</span>
        </div>
      </div>

      <button className="mx-[15px] mt-[30px] h-[45px] w-[315px] rounded-[100px] bg-[#0079de] text-[14px] font-normal leading-[17px] text-white" type="button">
        Pokaż ogłoszenia
      </button>
    </aside>
  );
}
