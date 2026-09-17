import { SettingsToggle, settingsAsset } from "./provider-settings-fields";
import { ProviderSettingsLayout } from "./provider-settings-layout";

const notificationOptions = [
  "Powiadomienia o nowych rezerwacjach.",
  "Powiadomienia o zmienionych rezerwacjach.",
  "Powiadomienia o odwołanych rezerwacjach.",
  "Dodatkowa komunikacja marketingowo-informacyjna."
] as const;

function NotificationChannel({ title, icon }: { title: string; icon: string }) {
  return (
    <section className="settings-section settings-notification-channel" aria-label={title}>
      <div className="settings-notification-heading">
        <span className="settings-notification-icon"><img src={settingsAsset(`notifications/${icon}`)} alt="" /></span>
        <h2>{title}</h2>
      </div>
      {notificationOptions.map(label => <SettingsToggle label={label} checked key={label} />)}
    </section>
  );
}

export function ProviderSettingsNotificationsPage() {
  return (
    <ProviderSettingsLayout active="Powiadomienia" figmaNode="5913:10174" fitContent>
      <NotificationChannel title="Powiadomienia E-mail" icon="email.svg" />
      <NotificationChannel title="Powiadomienia SMS" icon="phone.svg" />
    </ProviderSettingsLayout>
  );
}
