"use client";

export interface FilterGroupData {
  id: string;
  title: string;
  options: string[];
}

export type BoardFilterState = {
  facilities: Record<string, boolean>;
  maxPrice: string;
  minOrders: number;
  minPrice: string;
  minRating: number | null;
  modes: Record<"Jednosesyjne" | "Wielosesyjne", boolean>;
};

type BoardFiltersProps = {
  filteredCount: number;
  filters: BoardFilterState;
  groups: FilterGroupData[];
  onFiltersChange: (filters: BoardFilterState) => void;
  totalCount: number;
};

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex h-[45px] w-[315px] items-center rounded-[20px] bg-[#f4f6f9] px-[20px]">
      <img alt="" className="h-[16px] w-[16px]" src={icon} />
      <span className="ml-[20px] text-[14px] font-normal leading-[17px] text-[#2e3b4c]">{title}</span>
    </div>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={[
        "grid h-[16px] w-[16px] place-items-center rounded-[3px] border",
        checked ? "border-[#0079de] bg-[#0079de]" : "border-[#9ca3af] bg-white"
      ].join(" ")}
    >
      {checked ? <span className="h-[7px] w-[4px] rotate-45 border-b-2 border-r-2 border-white" /> : null}
    </span>
  );
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
    <span className={`flex h-[24px] w-[50px] items-center rounded-[30px] p-[3px] ${enabled ? "justify-end bg-[#0079de]" : "justify-start bg-[#e5e7eb]"}`}>
      <span className="h-[18px] w-[18px] rounded-full bg-white shadow-[0px_1px_2px_rgba(15,23,42,0.2)]" />
    </span>
  );
}

function numberValue(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function BoardFilters({ filteredCount, filters, groups, onFiltersChange, totalCount }: BoardFiltersProps) {
  const rating = groups[0] ?? { id: "rating", options: ["5", "4", "3", "2", "1"], title: "Ocena" };
  const price = groups[1] ?? { id: "price", options: ["od", "do"], title: "Cena" };
  const type = groups[2] ?? { id: "type", options: ["Jednosesyjne", "Wielosesyjne"], title: "Typ zlecenia" };
  const facilities = groups[3] ?? { id: "facilities", options: [], title: "Ułatwienia przy zamówieniu" };
  const orders = groups[4] ?? { id: "orders", options: [], title: "Min. ilość wykonanych zleceń" };
  const selectedFacilitiesCount = Object.values(filters.facilities).filter(Boolean).length;

  function update(next: Partial<BoardFilterState>) {
    onFiltersChange({ ...filters, ...next });
  }

  function toggleMode(mode: "Jednosesyjne" | "Wielosesyjne") {
    const nextModes = { ...filters.modes, [mode]: !filters.modes[mode] };
    const anyEnabled = Object.values(nextModes).some(Boolean);
    update({ modes: anyEnabled ? nextModes : filters.modes });
  }

  function resetFilters() {
    onFiltersChange({
      facilities: {},
      maxPrice: "",
      minOrders: 0,
      minPrice: "",
      minRating: null,
      modes: {
        Jednosesyjne: true,
        Wielosesyjne: true
      }
    });
  }

  return (
    <aside
      className="h-auto min-h-[916px] w-[345px] rounded-[20px] border border-[#e6edf3] bg-white pb-[20px] shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]"
      data-node-id="1141:1456"
    >
      <div className="mx-[15px] mt-[15px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-review.svg" title={rating.title} />
        <div className="mt-[10px] grid gap-[10px]">
          {rating.options.map((option) => {
            const ratingValue = Number(option);
            const checked = filters.minRating === ratingValue;

            return (
              <button
                className="flex h-[22px] w-[315px] items-center px-[15px]"
                key={option}
                onClick={() => update({ minRating: checked ? null : ratingValue })}
                type="button"
              >
                <CheckBox checked={checked} />
                <span className="ml-[15px] w-[9px] text-left text-[12px] font-normal leading-3 text-[#2e3b4c]">{option}</span>
                <span className="ml-[15px]">
                  <Stars count={ratingValue} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button className="mx-[15px] mt-[30px] flex h-[45px] w-[315px] items-center rounded-[50px] bg-[#f4f6f9] px-[20px]" type="button">
        <img alt="" className="h-[16px] w-[16px]" src="/figma-assets/board-shield.svg" />
        <span className="ml-[20px] text-[14px] font-medium leading-normal text-[#2e3b4c]">Usługi dodatkowe</span>
        <span className="ml-[20px] flex h-[20px] w-[40px] items-center justify-center rounded-[20px] bg-[#0079de] text-center text-[14px] font-medium leading-normal text-white">
          {selectedFacilitiesCount}
        </span>
        <span className="flex-1" />
        <img alt="" className="h-[16px] w-[15px] -rotate-90" src="/figma-assets/board-chevron.svg" />
      </button>

      <div className="mx-[15px] mt-[30px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-coins.svg" title={price.title} />
        <div className="mt-[10px] flex h-[37px] w-[315px] items-center">
          <label className="block">
            <span className="sr-only">Cena od</span>
            <input
              className="h-[37px] w-[149px] rounded-[30px] border border-[#e5e7eb] px-[18px] text-center text-[14px] leading-[17px] text-[#2e3b4c] outline-none placeholder:text-[#9ca3af]"
              inputMode="numeric"
              onChange={(event) => update({ minPrice: numberValue(event.target.value) })}
              placeholder="od"
              value={filters.minPrice}
            />
          </label>
          <span className="w-[17px] text-center text-[14px] text-[#9ca3af]">-</span>
          <label className="block">
            <span className="sr-only">Cena do</span>
            <input
              className="h-[37px] w-[149px] rounded-[30px] border border-[#e5e7eb] px-[18px] text-center text-[14px] leading-[17px] text-[#2e3b4c] outline-none placeholder:text-[#9ca3af]"
              inputMode="numeric"
              onChange={(event) => update({ maxPrice: numberValue(event.target.value) })}
              placeholder="do"
              value={filters.maxPrice}
            />
          </label>
        </div>
      </div>

      <div className="mx-[15px] mt-[30px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-choose.svg" title={type.title} />
        <div className="mt-[10px] grid gap-[10px]">
          {type.options.map((option) => {
            const mode = option as "Jednosesyjne" | "Wielosesyjne";

            return (
              <button className="flex h-[24px] w-[315px] items-center px-[15px]" key={option} onClick={() => toggleMode(mode)} type="button">
                <Toggle enabled={filters.modes[mode]} />
                <span className="ml-[20px] text-[14px] leading-[17px] text-[#2e3b4c]">{option}</span>
                <img alt="" className="ml-[10px] h-[14px] w-[14px]" src="/figma-assets/board-info.svg" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-[15px] mt-[30px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-terms.svg" title={facilities.title} />
        <div className="mt-[10px] grid gap-[10px]">
          {facilities.options.map((option) => {
            const checked = Boolean(filters.facilities[option]);

            return (
              <button
                className="flex h-[23px] w-[315px] items-center px-[15px]"
                key={option}
                onClick={() => update({ facilities: { ...filters.facilities, [option]: !checked } })}
                type="button"
              >
                <CheckBox checked={checked} />
                <span className="ml-[20px] text-left text-[14px] leading-[17px] text-[#2e3b4c]">{option}</span>
                <img alt="" className="ml-[10px] h-[14px] w-[14px]" src="/figma-assets/board-info.svg" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-[15px] mt-[30px] w-[315px]">
        <SectionHeader icon="/figma-assets/board-shield.svg" title={orders.title} />
        <div className="mt-[10px] flex h-[40px] w-[315px] items-center px-[15px]">
          <span className="flex h-[30px] w-[46px] items-center justify-center rounded-[10px] border border-[#e5e7eb] text-[12px] leading-5 text-[#2e3b4c]">
            {filters.minOrders}
          </span>
          <input
            aria-label="Minimalna ilość wykonanych usług"
            className="ml-[8px] h-[6px] w-[206px] accent-[#0079de]"
            max="166"
            min="0"
            onChange={(event) => update({ minOrders: Number(event.target.value) })}
            type="range"
            value={filters.minOrders}
          />
          <span className="ml-[8px] text-[12px] leading-5 text-[#9ca3af]">166</span>
        </div>
      </div>

      <div className="mx-[15px] mt-[30px] grid gap-[10px]">
        <div className="flex h-[45px] w-[315px] items-center justify-center rounded-[100px] bg-[#0079de] text-[14px] font-normal leading-[17px] text-white">
          Pokaż ogłoszenia ({filteredCount}/{totalCount})
        </div>
        <button className="h-[37px] w-[315px] rounded-[100px] border border-[#e5e7eb] text-[13px] text-[#2e3b4c]" onClick={resetFilters} type="button">
          Wyczyść filtry
        </button>
      </div>
    </aside>
  );
}
