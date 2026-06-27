import { DashboardShell } from "../../components/dashboard-shell";
import { PageHeading } from "../../components/page-heading";
import {
  ExternalConnectionsSection,
  NotificationSection,
  SettingsFormSection
} from "../../components/settings-section";
import {
  addressSettings,
  externalConnections,
  notificationSettings,
  passwordSettings,
  personalSettings
} from "../../lib/panel-mock-data";

export default function SettingsPage() {
  const formSections = [personalSettings, addressSettings, passwordSettings];

  return (
    <DashboardShell active="Ustawienia">
      <section className="w-full md:w-[1090px]">
        <PageHeading
          description="Sprawdzaj opinie pozostawione przez klientów po wykonanych zleceniach."
          title="Ustawienia"
        />

        <section className="grid gap-5 md:mt-[10px] md:max-w-[745px]">
          {formSections.map((section) => (
            <SettingsFormSection key={section.id} section={section} />
          ))}

          <NotificationSection settings={notificationSettings} />
          <ExternalConnectionsSection connections={externalConnections} />
        </section>
      </section>
    </DashboardShell>
  );
}
