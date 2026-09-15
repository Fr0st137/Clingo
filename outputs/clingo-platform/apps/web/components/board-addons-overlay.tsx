"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { BoardAddOnFilter } from "./board-filters";

function addOnIcon(addOn: BoardAddOnFilter) {
  const id = addOn.id.toLowerCase();
  const label = addOn.label.toLowerCase();
  if (id.includes("window") || label.includes("okien")) return "/clingo-homepage/assets/icons/addon-mycie-okien.png";
  if (id.includes("fridge") || label.includes("lodów")) return "/clingo-homepage/assets/icons/addon-lodowka.png";
  if (id.includes("dishes") || label.includes("naczy")) return "/clingo-homepage/assets/icons/addon-naczynia.png";
  if (id.includes("oven") || label.includes("piekarnik")) return "/clingo-homepage/assets/icons/addon-piekarnik.png";
  if (id.includes("hood") || label.includes("okapu")) return "/clingo-homepage/assets/icons/addon-okap.png";
  if (id.includes("microwave") || label.includes("mikrofal")) return "/clingo-homepage/assets/icons/addon-mikrofalowka.png";
  if (id.includes("ironing") || label.includes("prasowanie")) return "/clingo-homepage/assets/icons/addon-prasowanie.png";
  if (id.includes("wardrobe") || label.includes("szafy")) return "/clingo-homepage/assets/icons/addon-szafa.png";
  if (id.includes("cabinet") || label.includes("szafek")) return "/clingo-homepage/assets/icons/addon-szafki.png";
  if (id.includes("litter") || label.includes("kuwety")) return "/clingo-homepage/assets/icons/addon-kuweta.png";
  return "/clingo-homepage/assets/icons/services-extra.svg";
}

function AddOnCard({ addOn, quantity, onChange }: {
  addOn: BoardAddOnFilter;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  const selected = quantity > 0;
  return (
    <article className={[
      "relative flex h-[155px] w-[150px] flex-col items-center gap-[5px] overflow-hidden rounded-[30px] border px-[13px] py-[15px] shadow-[0px_2px_1.5px_rgba(0,0,0,0.04)]",
      selected ? "border-[#c2c9d5] bg-[#dee4ea]" : "border-[#d9d9d9] bg-white"
    ].join(" ")}>
      {selected ? <Image alt="" className="absolute right-[17px] top-[19px] h-[14px] w-[14px] object-contain" height={14} src="/clingo-homepage/assets/icons/addon-check.svg" width={14} /> : null}
      <span className="flex h-[50px] w-[50px] items-center justify-center rounded-[30px] p-[5px] drop-shadow-[-1px_2px_2px_rgba(0,0,0,0.15)]">
        <Image alt="" className="h-[40px] w-[40px] object-contain" height={40} src={addOnIcon(addOn)} width={40} />
      </span>
      <span className="flex h-[36px] w-[124px] items-center justify-center py-[2px] text-center text-[14px] font-normal leading-[17px] text-[#2e3b4c]">
        {addOn.label}
      </span>
      {selected ? (
        <div className="flex h-[30px] w-[124px] items-center justify-center rounded-[30px] bg-[#0079de] px-[2px] py-[6px] text-[14px] font-medium leading-none text-white">
          <button aria-label={`Zmniejsz ilość: ${addOn.label}`} className="relative h-[17px] flex-1 before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-[9px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-[5px] before:bg-white" onClick={() => onChange(quantity - 1)} type="button" />
          <span className="w-[22px] text-center">{quantity}</span>
          <span>szt.</span>
          <button aria-label={`Zwiększ ilość: ${addOn.label}`} className="relative h-[17px] flex-1 before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-[9px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-[5px] before:bg-white after:absolute after:left-1/2 after:top-1/2 after:h-px after:w-[9px] after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-90 after:rounded-[5px] after:bg-white" disabled={quantity >= 20} onClick={() => onChange(Math.min(20, quantity + 1))} type="button" />
        </div>
      ) : (
        <button className="h-[30px] w-[124px] rounded-[30px] bg-[#0079de] py-[6px] text-[14px] font-medium leading-none text-white hover:bg-[#006bc6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0079de]" onClick={() => onChange(1)} type="button">
          Wybierz
        </button>
      )}
    </article>
  );
}

export function BoardAddOnsOverlay({ addOns, quantities, onChange, onClose }: {
  addOns: BoardAddOnFilter[];
  quantities: Map<string, number>;
  onChange: (id: string, quantity: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <section aria-label="Usługi dodatkowe" className="absolute inset-x-0 top-0 z-20 min-h-[979px] overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-[rgba(244,246,249,0.8)] p-[25px] shadow-[0px_2px_14px_rgba(0,0,0,0.08)] backdrop-blur-[20px]" data-node-id="1237:1641" id="board-add-ons-overlay">
      <div className="grid grid-cols-6 gap-x-[25px] gap-y-[20px]">
        {addOns.map(addOn => <AddOnCard addOn={addOn} key={addOn.id} onChange={quantity => onChange(addOn.id, quantity)} quantity={quantities.get(addOn.id) ?? 0} />)}
      </div>
      {addOns.length === 0 ? <p className="m-0 text-[14px] text-[#7c8691]">Brak usług dodatkowych dla tych ogłoszeń.</p> : null}
    </section>
  );
}
