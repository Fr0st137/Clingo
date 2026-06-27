import { Pencil } from "lucide-react";
import { menuItems, user } from "../lib/dashboard-data";

type SidebarProps = {
  active?: string;
  compact?: boolean;
};

export function Sidebar({ active = "Zamówienia", compact = false }: SidebarProps) {
  return (
    <aside className={compact ? "w-full" : "w-full md:w-[320px]"}>
      <section className="relative flex h-[89px] items-center gap-[15px] rounded-[15px] bg-white px-[17px] shadow-figma">
        <div className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full bg-[#2438af] text-[40px] font-extrabold leading-none text-white">
          {user.initials}
        </div>

        <button
          aria-label="Edytuj profil"
          className="absolute left-[58px] top-[11px] grid h-[22px] w-[22px] place-items-center rounded-full border border-[#d7e2ef] bg-[#eef3f8] text-[#64758c] transition-all hover:border-clingo-blue hover:text-clingo-blue"
          type="button"
        >
          <Pencil className="h-[12px] w-[12px]" strokeWidth={2} />
        </button>

        <div className="min-w-0 pt-[1px]">
          <h1 className="truncate text-[21px] font-bold leading-[23px] text-clingo-ink">{user.name}</h1>
          <p className="mt-[5px] text-[15px] leading-[18px] text-[#7d8999]">{user.phone}</p>
        </div>
      </section>

      <section className="relative mt-[13px] h-[508px] rounded-[15px] bg-white px-[15px] pb-[29px] pt-[18px] shadow-figma">
        <nav className="space-y-[15px]">
          {menuItems.map(({ label, icon: Icon, href }) => {
            const isActive = label === active || (active === "Zamówienia" && label === "Zamówienie");

            return (
              <a
                className={[
                  "flex h-[45px] items-center gap-[22px] rounded-[24px] px-[20px] text-[15px] leading-[18px] transition-all",
                  isActive ? "bg-[#f2f5f9] font-medium text-[#2f4056]" : "text-[#7a8798] hover:bg-[#f7f9fc] hover:text-[#2f4056]"
                ].join(" ")}
                href={href ?? "#"}
                key={label}
              >
                <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.7} />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>

        <div className="absolute bottom-[33px] left-[35px] right-[35px] flex justify-between text-[14px] leading-[17px] text-clingo-blue">
          <a className="transition-all hover:text-clingo-blueDark" href="#">
            Pomoc
          </a>
          <a className="transition-all hover:text-clingo-blueDark" href="#">
            Wyloguj się
          </a>
        </div>
      </section>
    </aside>
  );
}
