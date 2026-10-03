export type ProviderProfileSettings = { name: string; legalName: string; phone: string; contactName: string; contactPhone: string; contactEmail: string; revision: number };
export type ProfileSettingsResponse = { profile: ProviderProfileSettings; loginEmail: string };
export type NotificationChannel = { created: boolean; changed: boolean; cancelled: boolean; marketing: boolean };
export type NotificationSettings = { email: NotificationChannel; sms: NotificationChannel; revision: number };
export const notificationOptions: Array<{ key: keyof NotificationChannel; label: string }> = [
  { key: "created", label: "Nowe rezerwacje" }, { key: "changed", label: "Zmienione rezerwacje" },
  { key: "cancelled", label: "Odwołane rezerwacje" }, { key: "marketing", label: "Dodatkowa komunikacja marketingowo-informacyjna" }
];

export function downloadJson(data: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
