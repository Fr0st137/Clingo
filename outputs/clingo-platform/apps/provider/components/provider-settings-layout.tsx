import Link from "next/link";
import type { ReactNode } from "react";
import { ProviderShell } from "./provider-shell";

export type ProviderSettingsTab = "Twoje dane" | "Lokalizacja i zasięg" | "Powiadomienia" | "Kalendarz";

const tabs: ReadonlyArray<{ label: ProviderSettingsTab; href?: string }> = [
  { label: "Twoje dane", href: "/settings" },
  { label: "Lokalizacja i zasięg", href: "/settings/location" },
  { label: "Powiadomienia", href: "/settings/notifications" },
  { label: "Kalendarz", href: "/settings/calendar" }
];

export function ProviderSettingsLayout({ active, figmaNode, children, fitContent = false }: {
  active: ProviderSettingsTab;
  figmaNode: string;
  children: ReactNode;
  fitContent?: boolean;
}) {
  return (
    <ProviderShell figmaNode={figmaNode} settingsActive>
      <div className="settings-content">
        <div className="settings-layout">
          <nav className="settings-tabs" aria-label="Ustawienia konta">
            {tabs.map(tab => tab.href ? (
              <Link key={tab.label} href={tab.href} className={`settings-tab${tab.label === active ? " is-active" : ""}`} aria-current={tab.label === active ? "page" : undefined}>{tab.label}</Link>
            ) : <span key={tab.label} className={`settings-tab${tab.label === active ? " is-active" : ""}`}>{tab.label}</span>)}
          </nav>
          <div className={`settings-panel${fitContent ? " is-fit-content" : ""}`} role="region" aria-label={active} tabIndex={0}>
            <div className="settings-sections">{children}</div>
          </div>
        </div>
      </div>
    </ProviderShell>
  );
}
