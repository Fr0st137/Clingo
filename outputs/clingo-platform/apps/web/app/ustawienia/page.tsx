import { fetchPrivateJson } from "../../lib/private-api";
import type { AccountProfile } from "../../lib/account";
import { DashboardShell } from "../../components/dashboard-shell";
import { PageHeading } from "../../components/page-heading";
import {
  ExternalConnectionsSection,
  NotificationSection,
  SettingsFormSection
} from "../../components/settings-section";
import {
  accountProfileToSidebarUser,
  settingsFromAccountProfile
} from "../../lib/account";
import { getSettings } from "../../lib/api";

export default async function SettingsPage() {
  const [settings, accountProfile] = await Promise.all([
    getSettings(),
    fetchPrivateJson<{ user: AccountProfile }>("/auth/profile").then(result => result.user)
  ]);
  const accountSettings = settingsFromAccountProfile(settings, accountProfile);
  const accountUser = accountProfileToSidebarUser(accountProfile);

  return (
    <DashboardShell active="Ustawienia" user={accountUser}>
      <section className="min-w-0 w-full">
        <PageHeading
          description="Zarządzaj swoimi danymi, hasłem i preferencjami powiadomień."
          title="Ustawienia"
        />

        <section className="grid gap-5 md:mt-[10px] md:max-w-[745px]">
          {accountSettings.sections.map((section) => (
            <SettingsFormSection accountEmail={accountProfile?.email} key={section.id} section={section} />
          ))}

          <NotificationSection settings={accountSettings.notifications} />
          <ExternalConnectionsSection connections={accountSettings.externalConnections} />
        </section>
      </section>
    </DashboardShell>
  );
}
