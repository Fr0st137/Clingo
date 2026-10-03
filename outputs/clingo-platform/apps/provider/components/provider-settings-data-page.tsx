"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ProviderSettingsLayout } from "./provider-settings-layout";
import { SettingsSection } from "./provider-settings-fields";
import { SettingsFeedback, SettingsInput, SettingsLoadState, useSettingsResource, useUnsavedSettings } from "./provider-settings-state";
import { useProvider } from "./provider-session";
import { ApiError, providerApi } from "../lib/provider-client";
import { downloadJson, type ProfileSettingsResponse, type ProviderProfileSettings } from "../lib/provider-settings";

function CompanyForm() {
  const resource = useSettingsResource<ProfileSettingsResponse>("settings/profile");
  const context = useProvider();
  const setAccountName = context?.setAccountName;
  const [draft, setDraft] = useState<ProviderProfileSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const pending = useRef(false);
  useEffect(() => { if (resource.data) { setDraft(resource.data.profile); setAccountName?.(resource.data.profile.name); setError(""); setConflict(false); } }, [resource.data, setAccountName]);
  const dirty = !!draft && !!resource.data && JSON.stringify(draft) !== JSON.stringify(resource.data.profile);
  useUnsavedSettings(dirty);
  const change = (key: keyof ProviderProfileSettings, value: string) => { setDraft(current => current ? { ...current, [key]: value } : current); setMessage(""); };
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || pending.current) return;
    pending.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const result = await providerApi<ProfileSettingsResponse>("settings/profile", "PUT", draft);
      resource.setData(result); setDraft(result.profile); context?.setAccountName(result.profile.name);
      setMessage("Dane działalności zostały zapisane."); setConflict(false);
    } catch (error) { setError((error as Error).message); setConflict(error instanceof ApiError && error.status === 409); }
    finally { pending.current = false; setBusy(false); }
  }
  if (resource.loading || resource.error || !draft) return <SettingsLoadState loading={resource.loading || (!resource.error && !draft)} error={resource.error} retry={resource.reload} />;
  return <form className="settings-live-form" onSubmit={save}>
    <h1>Twoje dane</h1>
    <SettingsSection title="Dane działalności" description="Dane zapisane w panelu wykonawcy. Zmiana nazwy pojawi się również w bocznym menu.">
      <fieldset disabled={busy} className="settings-live-fields">
        <SettingsInput label="Wyświetlana nazwa firmy / działalności" value={draft.name} onChange={event => change("name", event.target.value)} required maxLength={180} autoComplete="organization" />
        <SettingsInput label="Pełna nazwa firmy / działalności" value={draft.legalName} onChange={event => change("legalName", event.target.value)} maxLength={180} />
        <SettingsInput label="Numer telefonu działalności" type="tel" value={draft.phone} onChange={event => change("phone", event.target.value)} maxLength={40} autoComplete="tel" placeholder="+48 …" />
      </fieldset>
    </SettingsSection>
    <SettingsSection title="Dane osoby kontaktowej" description="Kontakt dotyczący Twojej działalności. Zmiana tych pól nie zmienia danych logowania.">
      <fieldset disabled={busy} className="settings-live-fields">
        <SettingsInput label="Imię i nazwisko osoby kontaktowej" value={draft.contactName} onChange={event => change("contactName", event.target.value)} maxLength={180} autoComplete="name" />
        <SettingsInput label="Numer telefonu osoby kontaktowej" type="tel" value={draft.contactPhone} onChange={event => change("contactPhone", event.target.value)} maxLength={40} />
        <SettingsInput label="E-mail osoby kontaktowej" type="email" value={draft.contactEmail} onChange={event => change("contactEmail", event.target.value)} maxLength={320} />
      </fieldset>
    </SettingsSection>
    <SettingsFeedback error={error} message={message} conflict={conflict} reload={resource.reload} />
    <div className="settings-live-actions"><button className="employee-save-button" disabled={busy || !dirty || conflict}>{busy ? "Zapisywanie…" : "Zapisz dane"}</button><span>{conflict ? "Wczytaj aktualną wersję danych." : dirty ? "Masz niezapisane zmiany." : "Dane są aktualne."}</span></div>
    <SettingsSection title="Adres e-mail do logowania" description="To konto służy do logowania zarówno w panelu wykonawcy, jak i klienta. Zmiana adresu oraz weryfikacja e-maila nie są jeszcze dostępne.">
      <SettingsInput label="Adres e-mail do logowania" type="email" value={resource.data?.loginEmail ?? ""} readOnly autoComplete="username" />
    </SettingsSection>
    <SettingsSection title="Publiczny profil Clingo" description="Łączenie działalności z publicznym profilem będzie dostępne w kolejnym etapie.">
      <p className="team-help">Po połączeniu profilu pojawi się tutaj link do udostępniania klientom.</p>
    </SettingsSection>
  </form>;
}

function PasswordForm() {
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef(false);
  useUnsavedSettings(Object.values(passwords).some(Boolean));
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    setError(""); setMessage("");
    if (passwords.newPassword !== passwords.confirmPassword) { setError("Nowe hasła muszą być takie same."); return; }
    pending.current = true; setBusy(true);
    try {
      const result = await providerApi<{ message: string }>("settings/password", "POST", passwords);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" }); setMessage(result.message);
    } catch (error) { setError((error as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <form className="settings-live-form" onSubmit={save}><SettingsSection title="Hasło" description="Hasło konta Clingo jest wspólne dla panelu klienta i wykonawcy. Zmiana wyloguje pozostałe sesje; bieżąca sesja w tym panelu pozostanie aktywna.">
    <p className="team-help">Nowe hasło powinno mieć 15–128 znaków. Użyj unikalnej frazy.</p>
    <fieldset className="settings-live-fields" disabled={busy}>
      <SettingsInput label="Obecne hasło" type="password" autoComplete="current-password" maxLength={128} required value={passwords.currentPassword} onChange={event => { setPasswords(current => ({ ...current, currentPassword: event.target.value })); setMessage(""); }} />
      <SettingsInput label="Nowe hasło" type="password" autoComplete="new-password" minLength={15} maxLength={128} required value={passwords.newPassword} onChange={event => { setPasswords(current => ({ ...current, newPassword: event.target.value })); setMessage(""); }} />
      <SettingsInput label="Powtórz nowe hasło" type="password" autoComplete="new-password" minLength={15} maxLength={128} required value={passwords.confirmPassword} onChange={event => { setPasswords(current => ({ ...current, confirmPassword: event.target.value })); setMessage(""); }} />
    </fieldset><SettingsFeedback error={error} message={message} /><button className="settings-button" disabled={busy}>{busy ? "Zmienianie hasła…" : "Zmień hasło"}</button>
  </SettingsSection></form>;
}

function CompanyExport() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef(false);
  async function download() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(""); setMessage("");
    try { downloadJson(await providerApi("settings/export"), "clingo-dane-dzialalnosci.json"); setMessage("Plik z zapisanymi danymi został przygotowany do pobrania."); }
    catch (error) { setError((error as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <SettingsSection title="Kopia danych działalności" description="Pobierz zapisane dane działalności, preferencje powiadomień oraz listę pracowników z grafikami. Plik nie obejmuje zamówień ani pozostałych danych konta klienta.">
    <button type="button" className="settings-button" disabled={busy} onClick={download}>{busy ? "Przygotowywanie pliku…" : "Pobierz dane działalności"}</button><SettingsFeedback error={error} message={message} />
  </SettingsSection>;
}
function DataSettings() {
  const context = useProvider();
  if (context?.account?.role === "employee") return <div className="provider-state" role="alert">Ustawienia działalności są dostępne dla właściciela i administratora.</div>;
  return <><CompanyForm /><PasswordForm /><CompanyExport /><SettingsSection title="Usunięcie konta" description="Usuwanie konta wykonawcy nie jest jeszcze dostępne. Wymaga powiązania zleceń i sprawdzenia zobowiązań działalności."><button type="button" className="settings-button" disabled>Usuń konto</button></SettingsSection></>;
}
export function ProviderSettingsDataPage() {
  return <ProviderSettingsLayout active="Twoje dane" figmaNode="1957:1857" live><DataSettings /></ProviderSettingsLayout>;
}
