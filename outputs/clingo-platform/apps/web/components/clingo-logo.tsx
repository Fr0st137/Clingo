import Link from "next/link";
export function ClingoLogo() {
  return (
    <Link className="flex items-center gap-[6px] text-[28px] font-extrabold leading-none text-clingo-blue" href="/home">
      <span className="h-6 w-[18px] rotate-[18deg] rounded-[70%_35%_55%_45%] bg-gradient-to-br from-[#0099f6] to-[#075ec6]" />
      <span>clingo</span>
    </Link>
  );
}
