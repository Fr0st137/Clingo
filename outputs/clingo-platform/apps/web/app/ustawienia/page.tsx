import { cookies } from "next/headers";
import { DashboardShell } from "../../components/dashboard-shell";
import { PageHeading } from "../../components/page-heading";
import {
  ExternalConnectionsSection,
  NotificationSection,
  SettingsFormSection
} from "../../components/settings-section";
import {
  accountProfileToSidebarUser,
  getAccountProfile,
  settingsFromAccountProfile
} from "../../lib/account";
import { getSettings } from "../../lib/api";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const accountEmail = cookieStore.get("clingo-user-email")?.value;
  const settings = await getSettings();
  const accountProfile = await getAccountProfile(accountEmail ? decodeURIComponent(accountEmail) : undefined);
  const accountSettings = settingsFromAccountProfile(settings, accountProfile);
  const accountUser = accountProfileToSidebarUser(accountProfile);

  return (
    <DashboardShell active="Ustawienia" user={accountUser}>
      <section className="w-full md:w-[1090px]">
        <PageHeading
          description="Sprawdzaj opinie pozostawione przez klientów po wykonanych zleceniach."
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
