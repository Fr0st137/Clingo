import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function OrderHeader() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center bg-[#f9fafb] px-4 shadow-[-2px_2px_10.5px_rgba(0,0,0,0.08)] md:px-8"
      data-node-id="5001:8121"
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between overflow-hidden">
        <Link aria-label="Clingo" className="relative block h-[36px] w-[117px] shrink-0" href="/home">
          <img
            alt="Clingo"
            width={117}
            height={36}
            className="h-full w-full object-contain"
            src="/clingo-homepage/assets/images/logo-clingo-color-new.png"
          />
        </Link>

        <div className="flex items-center justify-center gap-[10px] text-[14px] font-medium text-[#2e3b4c]">
          <span className="whitespace-nowrap">Bezpieczne zamówienie</span>
          <ShieldCheck aria-hidden="true" className="h-[14px] w-[14px] shrink-0" strokeWidth={1.8} />
        </div>
      </div>
    </header>
  );
}
