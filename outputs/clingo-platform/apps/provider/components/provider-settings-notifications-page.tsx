"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { settingsAsset } from "./provider-settings-fields";
import { ProviderSettingsLayout } from "./provider-settings-layout";
import { SettingsFeedback, SettingsLoadState, useSettingsResource, useUnsavedSettings } from "./provider-settings-state";
import { ApiError, providerApi } from "../lib/provider-client";
import { notificationOptions, type NotificationChannel, type NotificationSettings } from "../lib/provider-settings";

function NotificationForm() {
  const resource = useSettingsResource<NotificationSettings>("settings/notifications");
  const [draft, setDraft] = useState<NotificationSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const pending = useRef(false);
  useEffect(() => { if (resource.data) { setDraft(resource.data); setError(""); setConflict(false); } }, [resource.data]);
  const dirty = !!draft && !!resource.data && JSON.stringify(draft) !== JSON.stringify(resource.data);
  useUnsavedSettings(dirty);
  function toggle(channel: "email" | "sms", key: keyof NotificationChannel) {
    setDraft(current => current ? { ...current, [channel]: { ...current[channel], [key]: !current[channel][key] } } : current); setMessage("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || pending.current) return;
    pending.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const result = await providerApi<NotificationSettings>("settings/notifications", "PUT", draft);
      resource.setData(result); setDraft(result); setMessage("Preferencje powiadomień zostały zapisane."); setConflict(false);
    } catch (error) { setError((error as Error).message); setConflict(error instanceof ApiError && error.status === 409); }
    finally { pending.current = false; setBusy(false); }
  }
  if (resource.loading || resource.error || !draft) return <SettingsLoadState loading={resource.loading || (!resource.error && !draft)} error={resource.error} retry={resource.reload} />;
  return <form className="settings-live-form" onSubmit={save}>
    <h1>Powiadomienia</h1><p className="provider-feedback">Ustawienia dotyczą działalności wykonawcy. Preferencje zapisują się na koncie, ale wysyłka e-maili i SMS-ów nie jest jeszcze uruchomiona.</p>
    {(["email", "sms"] as const).map(channel => <section key={channel} className="settings-section settings-notification-channel" aria-label={channel === "email" ? "Powiadomienia e-mail" : "Powiadomienia SMS"}>
      <div className="settings-notification-heading"><span className="settings-notification-icon"><img src={settingsAsset(`notifications/${channel === "email" ? "email" : "phone"}.svg`)} alt="" /></span><h2>{channel === "email" ? "Powiadomienia e-mail" : "Powiadomienia SMS"}</h2></div>
      {notificationOptions.map(option => <div className="settings-toggle-row" key={option.key}><button type="button" className="settings-toggle" role="switch" aria-checked={draft[channel][option.key]} aria-label={`${channel === "email" ? "E-mail" : "SMS"} — ${option.label}`} disabled={busy} onClick={() => toggle(channel, option.key)}><img src={settingsAsset(`notifications/switch-${draft[channel][option.key] ? "on" : "off"}.svg`)} alt="" /></button><span>{option.label}</span></div>)}
    </section>)}
    <SettingsFeedback error={error} message={message} conflict={conflict} reload={resource.reload} />
    <div className="settings-live-actions"><button className="employee-save-button" disabled={busy || !dirty || conflict}>{busy ? "Zapisywanie…" : "Zapisz preferencje"}</button><span>{conflict ? "Wczytaj aktualną wersję danych." : dirty ? "Masz niezapisane zmiany." : "Preferencje są aktualne."}</span></div>
  </form>;
}
export function ProviderSettingsNotificationsPage() {
  return <ProviderSettingsLayout active="Powiadomienia" figmaNode="5913:10174" fitContent live><NotificationForm /></ProviderSettingsLayout>;
}
