"use client";

import { FormEvent, useState } from "react";

export interface SearchFieldData {
  id: string;
  label: string;
  value: string;
}

export function PublicSearchBar({ fields }: { fields: SearchFieldData[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.id, field.value]))
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form
      className="grid h-[60px] w-[1440px] overflow-hidden rounded-[20px] border border-[#e6edf3] bg-white shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)] md:grid-cols-[623.5px_1.5px_160px_1.5px_1fr]"
      data-node-id="5271:8795"
      onSubmit={submitSearch}
    >
      <label className="flex h-[60px] items-center px-[25px]" data-node-id="5271:8814">
        <span className="sr-only">{fields[0]?.label}</span>
        <input
          className="h-[17px] w-[262px] bg-transparent p-0 text-[14px] font-normal leading-[17px] text-[#2e3b4c] outline-none"
          onChange={(event) => setValues((current) => ({ ...current, service: event.target.value }))}
          value={values.service ?? ""}
        />
        <img alt="" className="ml-auto h-[16px] w-[16px]" src="/figma-assets/board-chevron.svg" />
      </label>

      <span className="my-[10px] h-[40px] w-[1.5px] rounded-[3px] bg-[#e5e7eb]" />

      <label className="flex h-[60px] items-center px-[25px]" data-node-id="5271:8823">
        <span className="sr-only">{fields[1]?.label}</span>
        <input
          className="h-[17px] w-[37px] bg-transparent p-0 text-[14px] font-normal leading-[17px] text-[#2e3b4c] outline-none"
          onChange={(event) => setValues((current) => ({ ...current, area: event.target.value }))}
          value={values.area ?? ""}
        />
        <img alt="" className="ml-auto h-[16px] w-[16px]" src="/figma-assets/board-chevron.svg" />
      </label>

      <span className="my-[10px] h-[40px] w-[1.5px] rounded-[3px] bg-[#e5e7eb]" />

      <label className="flex h-[60px] items-center px-[25px]" data-node-id="5271:8819">
        <span className="sr-only">{fields[2]?.label}</span>
        <img alt="" className="h-[17px] w-[17px]" src="/figma-assets/board-location.png" />
        <input
          className="ml-[10px] h-[17px] w-[216px] bg-transparent p-0 text-[14px] font-normal leading-[17px] text-[#2e3b4c] outline-none"
          onChange={(event) => setValues((current) => ({ ...current, location: event.target.value }))}
          value={values.location ?? ""}
        />
        <button
          aria-label="Szukaj"
          className="ml-auto grid h-[44px] w-[44px] place-items-center rounded-full bg-[#0079de]"
          type="submit"
        >
          <img alt="" className="h-[18px] w-[18px]" src="/figma-assets/board-search.svg" />
        </button>
      </label>
    </form>
  );
}
