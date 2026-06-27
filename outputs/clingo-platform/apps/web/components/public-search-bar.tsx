"use client";

import { ChevronDown, MapPin, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { SearchFieldData } from "../lib/public-mock-data";

export function PublicSearchBar({ fields }: { fields: SearchFieldData[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.id, field.value]))
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    const service = values.service?.trim();
    const area = values.area?.trim();
    const location = values.location?.trim();

    if (service) {
      params.set("q", service);
    }

    if (area) {
      params.set("area", area);
    }

    if (location) {
      params.set("location", location);
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    window.location.href = `/tablica-ogloszen${suffix}`;
  }

  return (
    <form
      className="grid w-full overflow-hidden rounded-xl border border-[#dce6f2] bg-white shadow-figma md:h-[60px] md:grid-cols-[1fr_160px_1fr]"
      onSubmit={submitSearch}
    >
      {fields.map((field, index) => (
        <label
          className={[
            "flex min-h-[60px] items-center gap-3 border-b border-[#e4ebf4] px-5 md:border-b-0",
            index > 0 ? "md:border-l" : "",
            index === fields.length - 1 ? "border-b-0" : ""
          ].join(" ")}
          key={field.id}
        >
          {field.id === "location" ? <MapPin className="h-4 w-4 text-clingo-blue" /> : null}
          <input
            aria-label={field.label}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-clingo-ink outline-none"
            onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
            value={values[field.id] ?? ""}
          />
          {field.id !== "location" ? <ChevronDown className="h-4 w-4 text-[#72839a]" /> : null}
          {field.id === "location" ? (
            <button
              aria-label="Szukaj"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clingo-blue text-white transition-all hover:bg-clingo-blueDark"
              type="submit"
            >
              <Search className="h-5 w-5" />
            </button>
          ) : null}
        </label>
      ))}
    </form>
  );
}
