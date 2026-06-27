"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { FilterGroupData } from "../lib/public-mock-data";

export function BoardFilters({ groups }: { groups: FilterGroupData[] }) {
  const [selected, setSelected] = useState<Record<string, string[]>>({
    rating: ["5 ★"],
    type: ["Jednosesyjne"],
    facilities: ["Bez wymaganych zdjęć lokalu"]
  });

  function toggle(groupId: string, value: string) {
    setSelected((current) => {
      const groupValues = current[groupId] ?? [];
      const nextValues = groupValues.includes(value)
        ? groupValues.filter((item) => item !== value)
        : [...groupValues, value];
      return { ...current, [groupId]: nextValues };
    });
  }

  return (
    <aside className="rounded-xl border border-[#dce6f2] bg-white p-4 shadow-figma md:w-[345px]">
      <div className="mb-5 flex items-center gap-3 border-b border-[#e4ebf4] pb-4">
        <SlidersHorizontal className="h-4 w-4 text-clingo-blue" />
        <h2 className="text-[15px] font-bold text-clingo-ink">Filtry</h2>
      </div>

      <div className="grid gap-6">
        {groups.map((group) => (
          <section key={group.id}>
            <h3 className="mb-3 text-[14px] font-bold text-clingo-ink">{group.title}</h3>
            <div className="grid gap-3">
              {group.options.map((option) => {
                const isChecked = selected[group.id]?.includes(option) ?? false;
                return (
                  <button
                    className="flex items-center gap-3 text-left text-[13px] text-[#536479] transition-all hover:text-clingo-blue"
                    key={option}
                    onClick={() => toggle(group.id, option)}
                    type="button"
                  >
                    <span
                      className={[
                        "grid h-5 w-5 place-items-center rounded-md border transition-all",
                        isChecked ? "border-clingo-blue bg-clingo-blue text-white" : "border-[#d8e3ef] bg-white"
                      ].join(" ")}
                    >
                      {isChecked ? <Check className="h-3 w-3" /> : null}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <button className="mt-8 h-[45px] w-full rounded-full bg-clingo-blue text-[13px] font-bold text-white transition-all hover:bg-clingo-blueDark">
        Zastosuj filtry
      </button>
    </aside>
  );
}
