"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ProviderSettingsLayout } from "./provider-settings-layout";
import { SettingsFeedback, SettingsInput, SettingsLoadState, useSettingsResource, useUnsavedSettings } from "./provider-settings-state";
import { ApiError, providerApi } from "../lib/provider-client";

type Location = { street: string; postalCode: string; city: string; radiusKm: number; revision: number };
function LocationForm() {
  const resource = useSettingsResource<Location>("settings/location");
  const [draft, setDraft] = useState<(Omit<Location, "radiusKm"> & { radiusKm: number | "" }) | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  useEffect(() => { if (resource.data) { setDraft(resource.data); setError(""); setConflict(false); } }, [resource.data]);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(resource.data);
  useUnsavedSettings(dirty);
  function change(key: keyof Location, value: string | number) { setDraft(previous => previous ? { ...previous, [key]: value } : previous); setMessage(""); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!draft || !dirty || pending.current || conflict) return;
    pending.current = true; setBusy(true); setError(""); setMessage("");
    try { const result = await providerApi<Location>("settings/location", "PUT", draft); resource.setData(result); setDraft(result); setMessage("Lokalizacja i zasięg zostały zapisane."); }
    catch (error) { setError((error as Error).message); setConflict(error instanceof ApiError && error.status === 409); }
    finally { pending.current = false; setBusy(false); }
  }
  if (resource.loading || resource.error || !draft) return <SettingsLoadState loading={resource.loading || (!resource.error && !draft)} error={resource.error} retry={resource.reload} />;
  return <form className="settings-live-form" onSubmit={save}><h1>Lokalizacja i zasięg</h1><p className="provider-feedback">Zapisz bazę dojazdu i planowany obszar obsługi w Polsce. Ustawienia nie zmieniają jeszcze wyników wyszukiwania ani dostępności rezerwacji.</p>
    <section className="settings-section" aria-label="Adres działalności"><h2>Adres wyjściowy</h2><fieldset disabled={busy} className="settings-live-fields">
      <SettingsInput label="Ulica i numer" required maxLength={240} autoComplete="street-address" value={draft.street} onChange={e => change("street", e.target.value)} />
      <SettingsInput label="Kod pocztowy" required maxLength={6} pattern="[0-9]{2}-[0-9]{3}" placeholder="00-000" autoComplete="postal-code" value={draft.postalCode} onChange={e => change("postalCode", e.target.value)} />
      <SettingsInput label="Miejscowość" required maxLength={120} autoComplete="address-level2" value={draft.city} onChange={e => change("city", e.target.value)} />
    </fieldset></section>
    <section className="settings-section" aria-label="Zasięg oferowania usług"><h2>Zasięg oferowania usług</h2><p>Promień dojazdu od adresu wyjściowego. Wartość 0 km oznacza obsługę tylko pod tym adresem.</p><label className="location-live-range"><span>Promień dojazdu: <strong>{draft.radiusKm === "" ? "—" : draft.radiusKm} km</strong></span><input type="range" min={0} max={100} step={1} value={draft.radiusKm === "" ? 0 : draft.radiusKm} aria-label="Promień dojazdu" aria-valuetext={`${draft.radiusKm} km`} disabled={busy} onChange={e => change("radiusKm", Number(e.target.value))} /><span className="location-range-ends"><span>0 km</span><span>100 km</span></span></label><SettingsInput label="Zasięg w kilometrach" type="number" min={0} max={100} step={1} required disabled={busy} value={draft.radiusKm} onChange={e => { change("radiusKm", e.target.value === "" ? "" : Number(e.target.value)); }} /><p className="team-help">Mapa obszaru pojawi się po uruchomieniu wyszukiwania współrzędnych adresu.</p></section>
    <SettingsFeedback error={error} message={message} conflict={conflict} reload={resource.reload} /><div className="settings-live-actions"><button className="employee-save-button" disabled={busy || conflict || !dirty}>{busy ? "Zapisywanie…" : "Zapisz lokalizację"}</button><span>{conflict ? "Wczytaj aktualną wersję danych." : dirty ? "Masz niezapisane zmiany." : "Dane są aktualne."}</span></div>
  </form>;
}
export function ProviderSettingsLocationPage() { return <ProviderSettingsLayout active="Lokalizacja i zasięg" figmaNode="1984:2519" fitContent live><LocationForm /></ProviderSettingsLayout>; }
