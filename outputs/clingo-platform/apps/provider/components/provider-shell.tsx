import Link from "next/link";
import type { ReactNode } from "react";

const sharedAsset = (name: string) => `/figma-assets/shared/${name}`;

export type ProviderNavLabel =
  | "Kalendarz"
  | "Zlecenia"
  | "Chat"
  | "Klienci"
  | "Twoje usługi"
  | "Pracownicy"
  | "Grafiki pracy"
  | "Opinie"
  | "Analizy i podsumowania";

const navigation: ReadonlyArray<{
  label: ProviderNavLabel;
  icon: string;
  href?: string;
}> = [
  { label: "Kalendarz", icon: "nav-calendar.svg", href: "/" },
  { label: "Zlecenia", icon: "nav-orders.svg", href: "/orders" },
  { label: "Chat", icon: "nav-chat.svg", href: "/chat" },
  { label: "Klienci", icon: "nav-clients.svg", href: "/clients" },
  { label: "Twoje usługi", icon: "nav-services.svg", href: "/services" },
  { label: "Pracownicy", icon: "nav-workers.svg", href: "/employees" },
  { label: "Grafiki pracy", icon: "nav-schedule.svg", href: "/work-schedules" },
  { label: "Opinie", icon: "nav-reviews.svg", href: "/reviews" },
  { label: "Analizy i podsumowania", icon: "nav-analytics.svg", href: "/analytics" }
];

function ProviderNavItem({ label, icon, href, active }: {
  label: ProviderNavLabel;
  icon: string;
  href?: string;
  active: boolean;
}) {
  const content = <><img src={sharedAsset(icon)} alt="" /><span>{label}</span></>;

  if (href) {
    return (
      <Link className={`provider-nav-item${active ? " is-active" : ""}`} href={href} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return <div className={`provider-nav-item${active ? " is-active" : ""}`}>{content}</div>;
}

export function ProviderSidebar({ active }: { active?: ProviderNavLabel }) {
  return (
    <aside className="provider-sidebar" aria-label="Panel wykonawcy">
      <div className="provider-profile">
        <div className="avatar-wrap">
          <img className="provider-avatar" src={sharedAsset("provider-avatar.png")} alt="Paulina Jagielska" />
          <span className="edit-avatar"><img src={sharedAsset("pencil.svg")} alt="" /></span>
        </div>
        <div className="provider-copy">
          <strong>Paulina Jagielska</strong>
          <div className="rating"><img src={sharedAsset("star.svg")} alt="" /><b>4.7</b><span>(3 oceny)</span></div>
        </div>
      </div>

      <section className="next-order" aria-label="Najbliższe zlecenie">
        <div className="next-order-service">
          <img src={sharedAsset("service-cleaning.png")} alt="" />
          <div><strong>Sprzątnie obiektów</strong><span>Mieszkań i domów</span></div>
        </div>
        <div className="next-order-divider" />
        <div className="next-order-time"><strong>8:45 → 10:45</strong><span>12 października</span></div>
      </section>

      <nav className="provider-nav" aria-label="Nawigacja panelu">
        {navigation.map(item => <ProviderNavItem {...item} active={item.label === active} key={item.label} />)}
      </nav>

      <div className="sidebar-actions">
        <span className="logout"><img src={sharedAsset("logout.svg")} alt="" />Wyloguj się</span>
        <span><img src={sharedAsset("help.svg")} alt="" />Pomoc</span>
      </div>
    </aside>
  );
}

function HeaderIcon({ file, label, badge, href, active = false }: { file: string; label: string; badge?: string; href?: string; active?: boolean }) {
  const icon = (
    <span className={`header-icon${active ? " is-active" : ""}`} aria-label={label}>
      <img src={sharedAsset(file)} alt="" />
      {badge ? <span>{badge}</span> : null}
    </span>
  );

  return href ? <Link className="header-icon-link" href={href} aria-label={label} aria-current={active ? "page" : undefined}>{icon}</Link> : icon;
}

export function ProviderHeader({ settingsActive = false }: { settingsActive?: boolean }) {
  return (
    <header className="provider-header">
      <img className="header-background" src={sharedAsset("header-background.png")} alt="" />
      <Link className="header-logo" href="/"><img src={sharedAsset("clingo-logo.png")} alt="Clingo" /></Link>
      <div className="header-search"><img src={sharedAsset("search.svg")} alt="" /><span>Szukaj</span></div>
      <div className="header-actions">
        <HeaderIcon file="header-chat.svg" label="Chat" href="/chat" />
        <HeaderIcon file="header-notifications.svg" label="Powiadomienia" badge="3" />
        <HeaderIcon file="header-membership.svg" label="Metody płatności" href="/payment-methods" />
        <HeaderIcon file={settingsActive ? "../settings/header-settings-active.svg" : "header-settings.svg"} label="Ustawienia" href="/settings" active={settingsActive} />
      </div>
    </header>
  );
}

export function ProviderShell({ active, figmaNode, children, settingsActive }: {
  active?: ProviderNavLabel;
  figmaNode: string;
  children: ReactNode;
  settingsActive?: boolean;
}) {
  return (
    <main className="provider-screen" data-figma-node={figmaNode}>
      <div className="sidebar-column"><ProviderSidebar active={active} /></div>
      <div className="provider-workspace">
        <ProviderHeader settingsActive={settingsActive} />
        {children}
      </div>
    </main>
  );
}
