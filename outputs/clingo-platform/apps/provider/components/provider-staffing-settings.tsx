"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, providerApi } from "../lib/provider-client";
import type { StaffingSettings } from "../lib/provider-staffing";
import { SettingsSection } from "./provider-settings-fields";
import { SettingsFeedback, SettingsInput, SettingsLoadState, useSettingsResource, useUnsavedSettings } from "./provider-settings-state";

export function ProviderStaffingSettings() {
  const resource = useSettingsResource<StaffingSettings>("settings/staffing");
  const [draft, setDraft] = useState({ mode: "team" as "solo" | "team", automatic: true, count: "1" });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState(""), [conflict, setConflict] = useState(false);
  useEffect(() => { if (resource.data) { setDraft({ mode: resource.data.mode, automatic: resource.data.declaredStaff === null, count: String(resource.data.declaredStaff ?? Math.max(1, resource.data.employeeCount)) }); setConflict(false); } }, [resource.data]);
  const declaredStaff = draft.mode === "solo" ? 1 : draft.automatic ? null : Number(draft.count);
  const dirty = !!resource.data && (draft.mode !== resource.data.mode || declaredStaff !== resource.data.declaredStaff);
  useUnsavedSettings(dirty);
  async function save(event: FormEvent) {
    event.preventDefault(); if (!resource.data || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await providerApi<StaffingSettings>("settings/staffing", "PUT", { mode: draft.mode, declaredStaff, revision: resource.data.revision });
      resource.setData(result); setMessage("Ustawienia obsady zostały zapisane.");
    } catch (error) { setError((error as Error).message); setConflict(error instanceof ApiError && error.status === 409); }
    finally { setBusy(false); }
  }
  return <form className="settings-live-form" onSubmit={save}><SettingsSection title="Obsada i sposób pracy" description="Określ, czy pracujesz samodzielnie, czy z zespołem. Liczba osób w widełkach usługi nie może przekraczać deklaracji ani liczby dodanych pracowników.">
    {resource.loading || resource.error ? <SettingsLoadState loading={resource.loading} error={resource.error} retry={resource.reload} /> : <>
      <fieldset className="settings-live-fields" disabled={busy}><legend>Sposób pracy</legend>
        <label><input type="radio" name="staffing-mode" checked={draft.mode === "solo"} onChange={() => { setDraft({ mode: "solo", automatic: false, count: "1" }); setMessage(""); }} /> Pracuję samodzielnie — 1 osoba</label>
        <label><input type="radio" name="staffing-mode" checked={draft.mode === "team"} onChange={() => { setDraft(current => ({ ...current, mode: "team" })); setMessage(""); }} /> Pracuję z zespołem</label>
        {draft.mode === "team" && <><label><input type="checkbox" checked={draft.automatic} onChange={event => { setDraft(current => ({ ...current, automatic: event.target.checked })); setMessage(""); }} /> Limit zgodny z liczbą dodanych osób</label>
          {!draft.automatic && <SettingsInput label="Deklarowana liczba osób" type="number" min={1} max={50} required value={draft.count} onChange={event => { setDraft(current => ({ ...current, count: event.target.value })); setMessage(""); }} />}</>}
      </fieldset>
      <p className="team-help">Dodane osoby: {resource.data?.employeeCount}. Aktualny limit osób w jednym przedziale: {resource.data?.limit}. <Link href="/employees">Przejdź do pracowników</Link>.</p>
      {resource.data?.employeeCount === 0 && <p className="team-help">Przed publikacją usługi dodaj własną kartotekę lub pracownika i ustaw grafik.</p>}
      {!!resource.data?.invalidOffers.length && <div className="provider-feedback is-error"><p>Popraw obsadę tych usług, aby były dostępne dla klientów:</p><ul>{resource.data.invalidOffers.map(offer => <li key={offer.id}><Link href={`/services/${offer.id}`}>{offer.title}</Link> — maksymalnie {offer.workers} osób w widełkach</li>)}</ul></div>}
      <SettingsFeedback error={error} message={message} conflict={conflict} reload={resource.reload} />
      <button className="settings-button" disabled={busy || !dirty || conflict}>{busy ? "Zapisywanie…" : "Zapisz ustawienia obsady"}</button>
    </>}
  </SettingsSection></form>;
}
