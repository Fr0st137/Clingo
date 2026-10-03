"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ProviderModal } from "./provider-modal";
import { ProviderLogout, ProviderSession, useProvider } from "./provider-session";
import { useSettingsResource } from "./provider-settings-state";
import { initials } from "../lib/provider-client";
import { timeLabel, type Job } from "../lib/provider-jobs";
import { parseDay, warsawToday } from "../lib/provider-schedule";

const sidebarAsset = (name: string) => `/figma-assets/sidebar/${name}`;

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
  const content = <><img src={sidebarAsset(icon)} alt="" /><span>{label}</span></>;

  if (href) {
    return (
      <Link className={`provider-nav-item${active ? " is-active" : ""}`} href={href} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return <div className={`provider-nav-item${active ? " is-active" : ""}`}>{content}</div>;
}

function ProviderNextOrder() {
  const resource = useSettingsResource<Job[]>("jobs");
  const today = warsawToday();
  const job = (resource.data ?? []).filter(row => row.status === "scheduled" && row.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute)[0];
  if (resource.loading || resource.error || !job) return <div className="next-order next-order-empty" role="status"><strong>Najbliższe zlecenie</strong><span>{resource.loading ? "Wczytywanie…" : resource.error ? "Nie udało się wczytać zlecenia." : "Brak zaplanowanych zleceń"}</span>{resource.error && <button type="button" onClick={resource.reload}>Spróbuj ponownie</button>}</div>;
  const day = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", timeZone: "UTC" }).format(parseDay(job.date));
  return <Link className="next-order next-order-link" href={`/orders/${job.id}/edit`} aria-label={`Najbliższe zlecenie: ${job.serviceTitle}, ${job.date}, ${timeLabel(job.startMinute)}`}>
    <div className="next-order-service"><img src={sidebarAsset("service-cleaning.png")} alt="" /><div><strong>{job.serviceTitle}</strong><span>{job.clientName}</span></div></div>
    <img className="next-order-divider" src={sidebarAsset("order-divider.svg")} alt="" />
    <div className="next-order-time"><strong className="next-order-hours"><span>{timeLabel(job.startMinute)}</span><img src={sidebarAsset("order-arrow.svg")} alt="do" /><span>{timeLabel(job.startMinute + job.durationMinutes)}</span></strong><span>{day}</span></div>
  </Link>;
}

export function ProviderSidebar({ active }: { active?: ProviderNavLabel }) {
  const context = useProvider();
  const [helpOpen, setHelpOpen] = useState(false);
  const name = context?.account?.name ?? "Panel wykonawcy";
  return (
    <aside className="provider-sidebar" aria-label="Panel wykonawcy" data-figma-node="3931:6087">
      <div className="provider-profile">
        <div className="avatar-wrap">
          <span className="provider-avatar employee-initials">{initials(name)}</span>
          <Link className="edit-avatar" href="/settings" aria-label="Edytuj profil"><img src={sidebarAsset("pencil.svg")} alt="" /></Link>
        </div>
        <div className="provider-copy">
          <strong>{name}</strong>
          <span>{context?.user.email}</span>
        </div>
      </div>

      <ProviderNextOrder />

      <nav className="provider-nav" aria-label="Nawigacja panelu">
        {navigation.map(item => <ProviderNavItem {...item} active={item.label === active} key={item.label} />)}
      </nav>

      <div className="sidebar-actions">
        <ProviderLogout />
        <button type="button" className="sidebar-help" onClick={() => setHelpOpen(true)}><img src={sidebarAsset("help.svg")} alt="" />Pomoc</button>
      </div>
      {helpOpen && <ProviderModal titleId="sidebar-help-title" onClose={() => setHelpOpen(false)}><h2 id="sidebar-help-title">Pomoc w panelu</h2><p>Wybierz sekcję z menu, aby zarządzać swoją działalnością. Dane konta i preferencje zmienisz w ustawieniach.</p><Link href="/settings" onClick={() => setHelpOpen(false)}>Przejdź do ustawień</Link></ProviderModal>}
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

export function ProviderHeader({ settingsActive = false, paymentsActive = false }: { settingsActive?: boolean; paymentsActive?: boolean }) {
  return (
    <header className="provider-header">
      <img className="header-background" src={sharedAsset("header-background.png")} alt="" />
      <Link className="header-logo" href="/"><img src={sharedAsset("clingo-logo.png")} alt="Clingo" /></Link>
      <div className="header-search"><img src={sharedAsset("search.svg")} alt="" /><span>Szukaj</span></div>
      <div className="header-actions">
        <HeaderIcon file="header-chat.svg" label="Chat" href="/chat" />
        <HeaderIcon file="header-notifications.svg" label="Powiadomienia" />
        <HeaderIcon file={paymentsActive ? "../payment-methods/billing/header-membership.svg" : "header-membership.svg"} label="Metody płatności" href="/payment-methods" active={paymentsActive} />
        <HeaderIcon file={settingsActive ? "../settings/header-settings-active.svg" : "header-settings.svg"} label="Ustawienia" href="/settings" active={settingsActive} />
      </div>
    </header>
  );
}
export function ProviderShell({ active, figmaNode, children, settingsActive, paymentsActive, live = active === "Pracownicy" || active === "Grafiki pracy" }: {
  active?: ProviderNavLabel;
  figmaNode?: string;
  children: ReactNode;
  settingsActive?: boolean;
  paymentsActive?: boolean;
  live?: boolean;
}) {
  return (
    <ProviderSession><main className={`provider-screen sidebar-unified${live ? " provider-live-screen" : ""}`} data-figma-node={figmaNode}>
      <div className="sidebar-column"><ProviderSidebar active={active} /></div>
      <div className="provider-workspace">
        <ProviderHeader settingsActive={settingsActive} paymentsActive={paymentsActive} />
        {!live && <p className="provider-preview-notice" role="status">Podgląd projektu — ten ekran zawiera dane przykładowe i nie jest jeszcze podłączony do konta.</p>}
        {children}
      </div>
    </main></ProviderSession>
  );
}
