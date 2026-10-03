"use client";

import Link from "next/link";
import { jobStatuses, timeLabel, type Job } from "../lib/provider-jobs";
import { offerPrice } from "../lib/provider-offers";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, initials, normalized, providerApi } from "../lib/provider-client";
import { ProviderShell } from "./provider-shell";
import { ProviderModal } from "./provider-modal";
import { useProvider } from "./provider-session";
import { SettingsInput, useSettingsResource, useUnsavedSettings } from "./provider-settings-state";

type ClientDraft = { name: string; email: string; phone: string; street: string; postalCode: string; city: string; notes: string };
type Client = ClientDraft & { id: string; revision: number };
const emptyClient = (): ClientDraft => ({ name: "", email: "", phone: "", street: "", postalCode: "", city: "", notes: "" });
const draftOf = (client: Client): ClientDraft => ({ name: client.name, email: client.email, phone: client.phone, street: client.street, postalCode: client.postalCode, city: client.city, notes: client.notes });

function ClientEditor({ client, onClose, onSaved, onReloaded }: { client: Client | null; onClose: () => void; onSaved: (client: Client) => void; onReloaded: (client: Client) => void }) {
  const [original, setOriginal] = useState(client);
  const [draft, setDraft] = useState<ClientDraft>(() => client ? draftOf(client) : emptyClient());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState<"close" | "reload" | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(original ? draftOf(original) : emptyClient());
  useUnsavedSettings(dirty);
  const close = () => { if (!busy) { if (dirty) setConfirm("close"); else onClose(); } };
  const field = (key: keyof ClientDraft) => ({ value: draft[key], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(current => ({ ...current, [key]: event.target.value })) });
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || conflict) return;
    setBusy(true); setError("");
    try {
      const saved = await providerApi<Client>(original ? `clients/${original.id}` : "clients", original ? "PUT" : "POST", { ...draft, ...(original ? { revision: original.revision } : {}) });
      onSaved(saved);
    } catch (error) { setError(error instanceof Error ? error.message : "Nie udało się zapisać klienta."); setConflict(error instanceof ApiError && error.status === 409); }
    finally { setBusy(false); }
  }
  async function discard() {
    if (confirm === "close") { onClose(); return; }
    if (!original) return;
    setBusy(true); setError("");
    try {
      const fresh = await providerApi<Client>(`clients/${original.id}`);
      setOriginal(fresh); setDraft(draftOf(fresh)); setConflict(false); setConfirm(null); onReloaded(fresh);
    } catch (error) { setError(error instanceof Error ? error.message : "Nie udało się wczytać klienta."); }
    finally { setBusy(false); }
  }
  return <ProviderModal className="client-editor" titleId="client-editor-title" onClose={close}>
    <h2 id="client-editor-title">{confirm ? (confirm === "reload" ? "Wczytać aktualne dane?" : "Odrzucić zmiany?") : original ? "Edytuj klienta" : "Dodaj klienta"}</h2>
    {confirm ? <><p>Niezapisane zmiany w formularzu zostaną utracone.</p>{error && <p role="alert">{error}</p>}<div className="settings-live-actions"><button type="button" className="settings-button" disabled={busy} onClick={() => setConfirm(null)}>Wróć do edycji</button><button type="button" className="employee-save-button" disabled={busy} onClick={discard}>{busy ? "Wczytywanie…" : confirm === "reload" ? "Odrzuć zmiany i wczytaj" : "Odrzuć zmiany"}</button></div></> :
    <form onSubmit={save}>
      <p>Kontakt, adres i notatki widoczne dla osób zarządzających Twoją działalnością.</p>
      <fieldset className="settings-live-fields" disabled={busy}>
        <SettingsInput label="Imię i nazwisko lub nazwa" required maxLength={180} autoComplete="name" {...field("name")} />
        <SettingsInput label="E-mail" type="email" maxLength={320} autoComplete="email" {...field("email")} />
        <SettingsInput label="Telefon" type="tel" maxLength={40} autoComplete="tel" {...field("phone")} />
        <SettingsInput label="Ulica i numer" maxLength={240} autoComplete="street-address" {...field("street")} />
        <SettingsInput label="Kod pocztowy" maxLength={20} autoComplete="postal-code" {...field("postalCode")} />
        <SettingsInput label="Miejscowość" maxLength={120} autoComplete="address-level2" {...field("city")} />
        <label className="settings-live-field client-notes-field"><span>Notatki</span><textarea rows={5} maxLength={2000} {...field("notes")} /><small>{draft.notes.length}/2000 znaków</small></label>
      </fieldset>
      {error && <div role="alert" className="provider-feedback is-error">{error}{conflict && <button type="button" className="settings-button" onClick={() => setConfirm("reload")}>Wczytaj aktualne dane</button>}</div>}
      <div className="settings-live-actions"><button type="button" className="settings-button" disabled={busy} onClick={close}>Anuluj</button><button type="submit" className="employee-save-button" disabled={busy || conflict || !dirty || !draft.name.trim()}>{busy ? "Zapisywanie…" : "Zapisz klienta"}</button></div>
    </form>}
  </ProviderModal>;
}

function ClientJobs({clientId}:{clientId:string}) {
  const resource=useSettingsResource<Job[]>("jobs");
  const jobs=(resource.data??[]).filter(job=>job.clientId===clientId).sort((a,b)=>b.date.localeCompare(a.date)||b.startMinute-a.startMinute);
  return <div className="client-orders-unavailable"><h3>Zlecenia klienta</h3>{resource.loading?<p role="status">Wczytywanie zleceń…</p>:resource.error?<p role="alert">{resource.error}</p>:jobs.length?<ul className="client-job-list">{jobs.map(job=><li key={job.id}><Link href={`/orders?edit=${job.id}`}>{job.date} · {timeLabel(job.startMinute)} — {job.serviceTitle}</Link><span>{jobStatuses[job.status]} · {offerPrice(job.priceMinor)}</span></li>)}</ul>:<p>Brak zleceń wpisanych w panelu dla tego klienta.</p>}<button className="settings-button" disabled={resource.loading} onClick={resource.reload}>Odśwież zlecenia</button><p className="team-help">Lista obejmuje zlecenia ręczne tej działalności.</p></div>;
}
function ClientsContent() {
  const resource = useSettingsResource<Client[]>("clients");
  const context = useProvider();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ client: Client | null } | null>(null);
  const [message, setMessage] = useState("");
  const clients = resource.data ?? [];
  const query = normalized(search.trim());
  const filtered = clients.filter(client => normalized([client.name, client.email, client.phone, client.street, client.postalCode, client.city].join(" ")).includes(query) || (/^[+\d ()-]+$/.test(query) && client.phone.replace(/\D/g, "").includes(query.replace(/\D/g, "")) && /\d/.test(query)));
  const selected = filtered.find(client => client.id === selectedId) ?? filtered[0];
  useEffect(() => { if (selected?.id) setSelectedId(selected.id); }, [selected?.id]);
  function merge(client: Client) {
    resource.setData(previous => [...(previous ?? []).filter(row => row.id !== client.id), client].sort((a, b) => a.name.localeCompare(b.name, "pl") || a.id.localeCompare(b.id)));
  }
  if (context?.account?.role === "employee") return <div className="provider-state">Kartoteka klientów jest dostępna dla właściciela i administratora działalności.</div>;
  if (resource.loading || resource.error) return <div className="provider-state" role={resource.error ? "alert" : "status"}>{resource.loading ? "Wczytywanie klientów…" : <><p>{resource.error}</p><button className="settings-button" onClick={resource.reload}>Spróbuj ponownie</button></>}</div>;
  return <>
    <div className="clients-live-heading"><div><h1>Klienci</h1><p>Kontakty i informacje o klientach Twojej firmy.</p></div><button className="settings-button" onClick={resource.reload}>Odśwież listę</button></div>
    {message && <p className="provider-feedback" role="status">{message}</p>}
    <div className="clients-content clients-live">
      <section className="clients-list-panel" aria-label="Lista klientów">
        <div className="clients-list-toolbar"><label className="client-search"><img src="/figma-assets/shared/search.svg" alt="" /><input type="search" aria-label="Szukaj klienta" placeholder="Szukaj klienta" value={search} onChange={event => setSearch(event.target.value)} /></label><button type="button" className="client-add-button" onClick={() => { setMessage(""); setEditor({ client: null }); }}>Dodaj<img src="/figma-assets/clients/plus.svg" alt="" /></button></div>
        <p className="clients-live-count" aria-live="polite">Wyświetlono: {filtered.length} z {clients.length}</p>
        <div className="client-rows">{filtered.map(client => <button type="button" aria-pressed={client.id === selected?.id} className={`client-row${client.id === selected?.id ? " is-active" : ""}`} key={client.id} onClick={() => { setSelectedId(client.id); setMessage(""); }}><span className="client-row-main"><span className="client-initials" aria-hidden="true">{initials(client.name)}</span><span>{client.name}</span></span><img className="client-chevron" src="/figma-assets/clients/chevron.svg" alt="" /></button>)}</div>
        {!filtered.length && <p className="clients-live-empty">{clients.length ? "Brak wyników. Zmień wpisaną frazę." : "Nie masz jeszcze klientów. Dodaj pierwszy kontakt do kartoteki."}</p>}
      </section>
      {selected ? <section className="client-profile-card" aria-label={`Dane klienta: ${selected.name}`}>
        <div className="client-profile-top"><button type="button" className="settings-button" onClick={() => { setMessage(""); setEditor({ client: selected }); }}>Edytuj klienta</button><span className="client-profile-avatar" aria-hidden="true">{initials(selected.name)}</span></div>
        <h2>{selected.name}</h2>
        <div className="client-contact-row">{selected.phone && <a className="client-contact" href={`tel:${selected.phone.replace(/[^+\d]/g, "")}`}>{selected.phone}</a>}{selected.email && <a className="client-contact" href={`mailto:${selected.email}`}>{selected.email}</a>}{!selected.email && !selected.phone && <p>Brak danych kontaktowych.</p>}</div>
        <article className="client-note"><h3>Adres</h3>{selected.street || selected.postalCode || selected.city ? <address>{selected.street && <span>{selected.street}<br /></span>}{[selected.postalCode, selected.city].filter(Boolean).join(" ")}</address> : <p>Nie podano adresu.</p>}</article>
        <article className="client-note"><h3>Notatki o kliencie</h3><p>{selected.notes || "Brak notatek. Dodaj wskazówki dotyczące obsługi klienta w edycji."}</p></article>
        <ClientJobs clientId={selected.id} />
      </section> : <section className="client-profile-card clients-live-empty"><h2>{clients.length ? "Nie znaleziono klienta" : "Twoja kartoteka klientów"}</h2><p>{clients.length ? "Wyszukaj klienta po nazwie, kontakcie lub adresie." : "Dodaj dane kontaktowe, adres i notatki, aby mieć je w jednym miejscu."}</p></section>}
    </div>
    {editor && <ClientEditor client={editor.client} onClose={() => setEditor(null)} onReloaded={merge} onSaved={client => { merge(client); setSelectedId(client.id); setSearch(""); setEditor(null); setMessage("Dane klienta zostały zapisane."); }} />}
  </>;
}
export function ProviderClientsPage() {
  return <ProviderShell active="Klienci" figmaNode="4033:7735" live><ClientsContent /></ProviderShell>;
}
