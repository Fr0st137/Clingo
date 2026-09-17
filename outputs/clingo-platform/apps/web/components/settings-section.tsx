"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearAccountProfileCache } from "../lib/account";
import { accountRequest } from "../lib/account-client";
export interface SettingsFieldData { id: string; label: string; value: string; placeholder?: string; type?: "text" | "email" | "password"; }
export interface SettingsSectionData { id: string; title: string; description: string; fields?: SettingsFieldData[]; actionLabel?: string; }
export interface NotificationSettingData { id: string; title: string; description: string; enabled: boolean; }
export interface ExternalConnectionData { id: string; provider: string; icon: string; }
const inputClass = "h-[46px] w-full rounded-[15px] border border-[#dce4ee] bg-[#f7f9fc] px-4 text-[14px] text-clingo-ink outline-none focus:border-[#0079de] disabled:opacity-60";
const sectionClass = "w-full rounded-[18px] border border-[#e6edf3] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:max-w-[745px] md:p-6";
const buttonClass = "mt-5 min-h-[44px] rounded-full bg-[#0079de] px-6 text-[14px] font-semibold text-white disabled:opacity-50";
export function SettingsFormSection({ section }: { accountEmail?: string; section: SettingsSectionData }) {
  const router = useRouter();
  const [values, setValues] = useState(Object.fromEntries((section.fields ?? []).map(field => [field.id, field.value])));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const password = section.id === "password";
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError(false); setStatus("");
    if (password && values.newPassword !== values.confirmPassword) { setError(true); setStatus("Nowe hasła muszą być takie same."); return; }
    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(values).filter(([key]) => key !== "email"));
      const result = await accountRequest<{ message?: string }>(password ? "password" : "profile", password ? "POST" : "PATCH", payload);
      clearAccountProfileCache();
      if (password) setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setStatus(result.message || "Zapisano zmiany.");
      router.refresh();
    } catch (error) { setError(true); setStatus(error instanceof Error ? error.message : "Nie udało się zapisać zmian."); }
    finally { setSaving(false); }
  }
  return <form className={sectionClass} onSubmit={save}>
    <header className="border-b border-[#e4ebf4] pb-4"><h3 className="text-[16px] font-bold text-clingo-ink">{section.title}</h3><p className="mt-2 text-[13px] leading-5 text-clingo-muted">{section.description}</p></header>
    <fieldset disabled={saving} className="mt-5 grid gap-4 md:grid-cols-2">
      {section.fields?.map(field => <label key={field.id} className={password || ["email", "phone", "companyName", "street"].includes(field.id) ? "md:col-span-2" : ""}>
        <span className="mb-2 block text-[13px] text-[#536479]">{field.label}</span>
        <input className={inputClass} name={field.id} type={field.type ?? (field.id === "phone" ? "tel" : "text")} value={values[field.id] ?? ""}
          readOnly={field.id === "email"} required={password} minLength={password && field.id !== "currentPassword" ? 15 : undefined}
          maxLength={password ? 128 : ({ firstName: 120, lastName: 120, companyName: 180, phone: 40, street: 180, apartment: 40, city: 120, postalCode: 20 } as Record<string, number>)[field.id] ?? 320}
          autoComplete={password ? field.id === "currentPassword" ? "current-password" : "new-password" : undefined}
          placeholder={field.id === "postalCode" ? "00-000" : field.placeholder}
          pattern={field.id === "postalCode" ? "[0-9]{2}-[0-9]{3}" : undefined}
          onChange={event => { setValues(current => ({ ...current, [field.id]: event.target.value })); setStatus(""); }} />
      </label>)}
    </fieldset>
    <button type="submit" className={buttonClass} disabled={saving}>{saving ? "Zapisywanie…" : section.actionLabel}</button>
    {status && <p role={error ? "alert" : "status"} className={`mt-3 text-[13px] ${error ? "text-red-700" : "text-green-700"}`}>{status}</p>}
  </form>;
}
export function NotificationSection({ settings }: { settings: NotificationSettingData[] }) {
  const [items, setItems] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setStatus(""); setError(false);
    try {
      await accountRequest("notifications", "PATCH", Object.fromEntries(items.map(item => [item.id, item.enabled])));
      clearAccountProfileCache(); setStatus("Zapisano preferencje powiadomień.");
    } catch (error) { setError(true); setStatus(error instanceof Error ? error.message : "Nie udało się zapisać."); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save} className={sectionClass}>
    <h3 className="text-[16px] font-bold text-clingo-ink">Powiadomienia</h3>
    <p className="mt-2 text-[13px] leading-5 text-clingo-muted">Preferencje zapisujemy na Twoim koncie. Wysyłka e-mail i SMS nie jest jeszcze uruchomiona.</p>
    <fieldset disabled={saving} className="mt-5 grid gap-4">{items.map(item => <label key={item.id} className="flex items-center justify-between gap-4">
      <span><strong className="text-[14px] text-clingo-ink">{item.title}</strong><span className="mt-1 block text-[13px] text-clingo-muted">{item.description}</span></span>
      <input type="checkbox" className="h-5 w-5 accent-[#0079de]" checked={item.enabled} onChange={event => { setStatus(""); setItems(current => current.map(value => value.id === item.id ? { ...value, enabled: event.target.checked } : value)); }} />
    </label>)}</fieldset>
    <button disabled={saving} type="submit" className={buttonClass}>{saving ? "Zapisywanie…" : "Zapisz powiadomienia"}</button>
    {status && <p role={error ? "alert" : "status"} className={`mt-3 text-[13px] ${error ? "text-red-700" : "text-green-700"}`}>{status}</p>}
  </form>;
}
export function ExternalConnectionsSection({ connections }: { connections: ExternalConnectionData[] }) {
  return <section className={sectionClass}><h3 className="text-[16px] font-bold text-clingo-ink">Połączenia zewnętrzne</h3><p className="mt-2 text-[13px] leading-5 text-clingo-muted">Logowanie przez Google, Facebook i Apple nie jest jeszcze dostępne. Do logowania używaj adresu e-mail i hasła.</p></section>;
}
