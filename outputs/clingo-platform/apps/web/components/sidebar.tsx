import { menuItems, user as defaultUser } from "../lib/dashboard-data";

export type SidebarUser = {
  initials: string;
  name: string;
  phone: string;
};

type SidebarProps = {
  active?: string;
  compact?: boolean;
  user?: SidebarUser;
};

type MenuIconName =
  | "chat"
  | "heart"
  | "orders"
  | "regulations"
  | "settings"
  | "standards"
  | "reviews";

const iconByLabel: Record<string, MenuIconName> = {
  Chat: "chat",
  Regulaminy: "regulations",
  Rezerwacje: "orders",
  "Standardy usług Clingo": "standards",
  "Twoje opinie": "reviews",
  Ulubione: "heart",
  Ustawienia: "settings",
  Zamówienia: "orders"
};

const iconSrcByName: Record<Exclude<MenuIconName, "chat">, string> = {
  heart: "/figma-assets/sidebar-heart.svg",
  orders: "/figma-assets/sidebar-orders.svg",
  regulations: "/figma-assets/sidebar-regulations.svg",
  reviews: "/figma-assets/sidebar-reviews.svg",
  settings: "/figma-assets/sidebar-settings-main.svg",
  standards: "/figma-assets/sidebar-standards.svg"
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

const activeIconStyle = {
  filter: "brightness(0) saturate(100%) invert(20%) sepia(15%) saturate(950%) hue-rotate(174deg) brightness(91%) contrast(90%)"
};

function MenuIcon({ active, name }: { active: boolean; name: MenuIconName }) {
  const imageStyle = active ? activeIconStyle : undefined;

  if (name === "chat") {
    return (
      <span className="relative h-[14px] w-[14px] shrink-0">
        <span className="absolute inset-[-0.1%_0_0_0]">
          <img alt="" className="absolute inset-0 h-full w-full max-w-none" src="/figma-assets/sidebar-chat-main.svg" style={imageStyle} />
        </span>
        <span className="absolute inset-[29.17%_45.83%_62.5%_29.17%]">
          <img alt="" className="absolute inset-0 h-full w-full max-w-none" src="/figma-assets/sidebar-chat-dot1.svg" style={imageStyle} />
        </span>
        <span className="absolute inset-[45.83%_29.17%]">
          <img alt="" className="absolute inset-0 h-full w-full max-w-none" src="/figma-assets/sidebar-chat-dot2.svg" style={imageStyle} />
        </span>
        <span className="absolute inset-[62.5%_29.17%_29.17%_29.17%]">
          <img alt="" className="absolute inset-0 h-full w-full max-w-none" src="/figma-assets/sidebar-chat-dot3.svg" style={imageStyle} />
        </span>
      </span>
    );
  }

  return (
    <span className="relative h-[14px] w-[14px] shrink-0">
      <img alt="" className="absolute inset-0 h-full w-full" src={iconSrcByName[name]} style={imageStyle} />
      {name === "settings" ? (
        <img
          alt=""
          className="absolute inset-[33.33%] h-[33.34%] w-[33.34%]"
          src="/figma-assets/sidebar-settings-dot.svg"
          style={imageStyle}
        />
      ) : null}
    </span>
  );
}

export function Sidebar({ active = "Rezerwacje", compact = false, user = defaultUser }: SidebarProps) {
  const activeKey = normalize(active === "Zamówienia" ? "Rezerwacje" : active);
  const logout = () => {
    document.cookie = "clingo-auth=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "clingo-user-email=; path=/; max-age=0; SameSite=Lax";
    window.localStorage.removeItem("clingo-auth");
    window.location.href = "/logowanie";
  };

  return (
    <aside
      className={[
        "relative flex flex-col items-start gap-[10px] rounded-[20px]",
        compact ? "w-full" : "w-full md:h-[821px] md:w-[320px]"
      ].join(" ")}
      data-name="Control Panel - Moje konto Użytkownik"
      data-node-id="4981:8274"
    >
      <section
        className="flex w-full items-center gap-[15px] rounded-[20px] border border-[#e5e7eb] bg-white p-[15px] shadow-[0px_4px_7px_0px_rgba(0,0,0,0.04)]"
        data-node-id="4981:8209"
      >
        <div className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-[99px] bg-[#1e40af] text-[40px] font-normal leading-none text-white shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.15),0px_1px_2px_0px_rgba(0,0,0,0.16)]">
          <span className="relative -top-px">{user.initials}</span>
        </div>

        <button
          aria-label="Edytuj profil"
          className="absolute left-[56px] top-[10px] grid h-[24px] w-[24px] place-items-center rounded-[45px] bg-[#e5e7eb] p-[5px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)]"
          type="button"
        >
          <img alt="" className="h-[12px] w-[12px]" src="/figma-assets/sidebar-pencil.svg" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-start gap-[5px] py-[5px]">
          <h1 className="m-0 whitespace-nowrap text-[20px] font-semibold leading-5 text-[#2e3b4c]">{user.name}</h1>
          <p className="m-0 whitespace-nowrap text-[14px] font-normal leading-6 text-[#7c8691]">{user.phone}</p>
        </div>
      </section>

      <section
        className="flex w-full flex-col items-start gap-[15px] overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white p-[15px] shadow-[0px_4px_14px_0px_rgba(0,0,0,0.04)]"
        data-node-id="4981:8218"
      >
        <nav className="grid gap-[15px]">
          {menuItems.map(({ label, href }) => {
            const isActive = normalize(label) === activeKey;

            return (
              <a
                className={[
                  "flex h-[45px] w-[290px] items-center gap-[20px] overflow-hidden rounded-[50px] px-[20px] text-[14px] font-normal leading-normal transition-colors",
                  isActive ? "bg-[#f4f6f9] text-[#2e3b4c]" : "text-[#7c8691]"
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
                href={href}
                key={label}
              >
                <MenuIcon active={isActive} name={iconByLabel[label]} />
                <span className="whitespace-nowrap">{label}</span>
              </a>
            );
          })}
        </nav>

        <div className="flex w-full items-center justify-between p-[20px] text-[14px] font-normal leading-normal text-[#0079de]">
          <a href="#">Pomoc</a>
          <button className="bg-transparent p-0 text-[14px] font-normal leading-normal text-[#0079de]" onClick={logout} type="button">
            Wyloguj się
          </button>
        </div>
      </section>
    </aside>
  );
}
