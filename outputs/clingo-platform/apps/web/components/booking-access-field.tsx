"use client";

import { useId } from "react";
import { accessMethods, isAccessMethod, type AccessMethod } from "../../api/src/dashboard/booking-access";

export function BookingAccessField({ value, onChange, required = true }: { value: string; onChange: (value: AccessMethod | "") => void; required?: boolean }) {
  const id = useId();
  const selected = accessMethods.find(option => option.id === value);
  return <div className="grid min-w-0 gap-[10px] text-[14px] text-[#2e3b4c]">
    <label htmlFor={id} className="font-medium">Sposób udostępnienia lokalu{required ? <span aria-hidden="true"> *</span> : null}</label>
    <select id={id} aria-label="Sposób udostępnienia lokalu" aria-describedby={`${id}-description`} required={required} value={isAccessMethod(value) ? value : ""} onChange={event => onChange(isAccessMethod(event.target.value) ? event.target.value : "")}
      className="min-h-[52px] w-full min-w-0 rounded-[15px] border border-[#e5e7eb] bg-white px-[15px] py-[12px] outline-none focus:border-[#0079de]">
      <option value="" disabled>Wybierz sposób udostępnienia lokalu</option>
      {accessMethods.map(option => <option key={option.id} value={option.id}>{option.id === "phone-contact" ? "Prośba o kontakt telefoniczny" : "Ktoś będzie w lokalu"}</option>)}
    </select>
    <p id={`${id}-description`} className="m-0 break-words text-[13px] leading-5 text-[#7c8691]">{selected?.label ?? "Wybierz jedną z opcji przed przejściem do zamówienia."}</p>
  </div>;
}
