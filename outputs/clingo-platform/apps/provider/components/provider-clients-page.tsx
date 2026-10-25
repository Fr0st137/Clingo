"use client";

import Link from "next/link";
import { jobStatuses, timeLabel, type Job } from "../lib/provider-jobs";
import { offerPrice } from "../lib/provider-offers";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, initials, normalized, providerApi } from "../lib/provider-client";
import { ProviderShell } from "./provider-shell";
import { ProviderJobEditor } from "./provider-job-editor";
import { parseDay, warsawToday } from "../lib/provider-schedule";
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

const clientAsset = (name: string) => `/figma-assets/clients/${name}`;

function clientJobs(jobs: Job[], client: Client) {
  return jobs.filter(job => job.clientId === client.id || (job.source === "booking" && !!client.email && job.clientEmail.toLowerCase() === client.email.toLowerCase()));
}
function ClientStatistics({ jobs, loading, error }: { jobs: Job[]; loading: boolean; error: string }) {
  const completed = jobs.filter(job => job.status === "completed");
  const latest = completed.map(job => job.date).sort().at(-1);
  const count = (rows: Job[]) => new Set(rows.map(job => job.bookingId ?? job.multiOrderId ?? job.id)).size;
  const value = (result: string | number) => loading ? "…" : error ? "—" : result;
  const statistics = [
    { label: "Zamówienia", value: value(count(jobs)) },
    { label: "Nieobecności", value: "—", hint: "Nieobecności nie są jeszcze rejestrowane." },
    { label: "Odwołane", value: value(count(jobs.filter(job => job.status === "cancelled"))) },
    { label: "Przychód z klienta", value: value(offerPrice(completed.reduce((sum, job) => sum + job.priceMinor, 0))) },
    { label: "Stały rabat", value: "—", hint: "Stały rabat klienta nie jest jeszcze obsługiwany." },
    { label: "Ostatnia wizyta", value: value(latest ? new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parseDay(latest)) : "—") }
  ];
  return <div className="client-statistics" aria-label="Statystyki klienta">{statistics.map(item => <div key={item.label} title={item.hint}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>;
}
function ClientOrders({ jobs, loading, error, reload, openJob }: { jobs: Job[]; loading: boolean; error: string; reload: () => void; openJob: (job: Job) => void }) {
  const [tab, setTab] = useState<"upcoming" | "finished">("upcoming");
  const upcoming = jobs.filter(job => job.status === "scheduled").sort((a,b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute);
  const finished = jobs.filter(job => job.status !== "scheduled").sort((a,b) => b.date.localeCompare(a.date) || b.startMinute - a.startMinute);
  const visible = tab === "upcoming" ? upcoming : finished;
  return <section className="client-orders-card" aria-labelledby="client-orders-title" data-figma-node="4066:6072">
    <h2 className="client-orders-title" id="client-orders-title">Zlecenia klienta</h2>
    <div className="client-order-tabs" role="tablist" aria-label="Zlecenia klienta" onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? "upcoming" : event.key === "End" ? "finished" : tab === "upcoming" ? "finished" : "upcoming";
      setTab(next);
      event.currentTarget.querySelector<HTMLButtonElement>(`#client-${next}-tab`)?.focus();
    }}>
      <button type="button" role="tab" id="client-upcoming-tab" aria-controls="client-orders-panel" aria-selected={tab === "upcoming"} tabIndex={tab === "upcoming" ? 0 : -1} className={tab === "upcoming" ? "is-active" : ""} onClick={() => setTab("upcoming")}>Nadchodzące ({upcoming.length})</button>
      <button type="button" role="tab" id="client-finished-tab" aria-controls="client-orders-panel" aria-selected={tab === "finished"} tabIndex={tab === "finished" ? 0 : -1} className={tab === "finished" ? "is-active" : ""} onClick={() => setTab("finished")}>Zakończone ({finished.length})</button>
    </div>
    <div className="client-orders-panel" role="tabpanel" id="client-orders-panel" aria-labelledby={tab === "upcoming" ? "client-upcoming-tab" : "client-finished-tab"}>
      {loading ? <p role="status" className="clients-panel-message">Wczytywanie zleceń…</p> : error ? <div role="alert" className="clients-panel-message"><p>{error}</p><button className="settings-button" type="button" onClick={reload}>Spróbuj ponownie</button></div> : visible.length ? <ul className="client-order-list">{visible.map(job => <li key={job.id}><button type="button" className="client-order-item" onClick={() => openJob(job)}><span className="client-order-item-top"><strong>{job.serviceTitle}</strong><span>{offerPrice(job.priceMinor)}</span></span><span>{new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(parseDay(job.date))} · {timeLabel(job.startMinute)}–{timeLabel(job.startMinute + job.durationMinutes)}</span><span className={`client-order-status is-${job.status}`}>{jobStatuses[job.status]}</span><span>{job.address}</span></button></li>)}</ul> : <div className="client-orders-empty"><img src={clientAsset("empty-orders-design.png")} width={188} height={160} alt="" /><strong>{tab === "upcoming" ? "Brak nadchodzących zamówień" : "Brak zakończonych zamówień"}</strong></div>}
    </div>
  </section>;
}
function ClientsContent() {
  const resource = useSettingsResource<Client[]>("clients");
  const jobsResource = useSettingsResource<Job[]>("jobs");
  const context = useProvider();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ client: Client | null } | null>(null);
  const [jobEditor, setJobEditor] = useState<{ job?: Job; clientId: string } | null>(null);
  const [message, setMessage] = useState("");
  const clients = resource.data ?? [];
  const query = normalized(search.trim());
  const filtered = clients.filter(client => normalized([client.name, client.email, client.phone, client.street, client.postalCode, client.city].join(" ")).includes(query) || (/^[+\d ()-]+$/.test(query) && client.phone.replace(/\D/g, "").includes(query.replace(/\D/g, "")) && /\d/.test(query)));
  const selected = filtered.find(client => client.id === selectedId) ?? filtered[0];
  const jobs = selected ? clientJobs(jobsResource.data ?? [], selected) : [];
  const fromClingo = jobs.some(job => job.source === "booking");
  useEffect(() => { if (selected?.id) setSelectedId(selected.id); }, [selected?.id]);
  function merge(client: Client) {
    resource.setData(previous => [...(previous ?? []).filter(row => row.id !== client.id), client].sort((a, b) => a.name.localeCompare(b.name, "pl") || a.id.localeCompare(b.id)));
  }
  if (context?.account?.role === "employee") return <div className="provider-state">Kartoteka klientów jest dostępna dla właściciela i administratora działalności.</div>;
  if (resource.loading || resource.error) return <div className="provider-state" role={resource.error ? "alert" : "status"}>{resource.loading ? "Wczytywanie klientów…" : <><p>{resource.error}</p><button className="settings-button" onClick={resource.reload}>Spróbuj ponownie</button></>}</div>;
  return <>
    <h1 className="sr-only">Klienci</h1>
    {message && <p className="provider-feedback clients-save-message" role="status">{message}</p>}
    <div className="clients-content clients-figma" data-figma-node="4033:7756">
      <section className="clients-list-panel" aria-label="Lista klientów" data-figma-node="4033:7757">
        <div className="clients-list-toolbar"><label className="client-search"><img src={clientAsset("search-design.svg")} alt="" /><input type="search" aria-label="Szukaj klienta" placeholder="Szukaj klienta" value={search} onChange={event => setSearch(event.target.value)} /></label><button type="button" className="client-add-button" onClick={() => { setMessage(""); setEditor({ client: null }); }}>Dodaj<img src={clientAsset("plus-design.svg")} alt="" /></button></div>
        <div className="client-rows">{filtered.map(client => <button type="button" aria-pressed={client.id === selected?.id} className={`client-row${client.id === selected?.id ? " is-active" : ""}`} key={client.id} onClick={() => { setSelectedId(client.id); setMessage(""); }}><span className="client-row-main"><span className="client-initials" aria-hidden="true">{initials(client.name)}</span><span className="client-row-name">{client.name}</span></span><img className="client-chevron" src={clientAsset("chevron-design.svg")} alt="" /></button>)}</div>
        {!filtered.length && <p className="clients-panel-message">{clients.length ? "Brak wyników. Zmień wpisaną frazę." : "Nie masz jeszcze klientów. Dodaj pierwszy kontakt do kartoteki."}</p>}
      </section>
      {selected ? <>
        <section className="client-profile-card" aria-label={`Dane klienta: ${selected.name}`} data-figma-node="4033:7928">
          <div className="client-profile-top"><div className="client-profile-side"><button type="button" className="client-round-action client-edit-action" aria-label="Edytuj klienta" onClick={() => { setMessage(""); setEditor({ client: selected }); }}><img src={clientAsset("pencil-design.svg")} alt="" /></button></div><span className="client-profile-avatar" aria-hidden="true">{initials(selected.name)}</span><div className="client-profile-side is-right"><button type="button" className="client-round-action" aria-label="Dodaj zlecenie dla klienta" onClick={() => setJobEditor({ clientId: selected.id })}><img src={clientAsset("calendar-add-design.svg")} alt="" /></button>{fromClingo && <span className="clingo-client-badge">Klient z Clingo<span><img src={clientAsset("clingo-favicon-design.png")} width={17} height={17} alt="Clingo" /></span></span>}</div></div>
          <h2>{selected.name}</h2>
          <div className="client-contact-row"><button type="button" className="client-round-action client-chat-action" aria-label="Wiadomość do klienta — funkcja niedostępna" title="Wiadomości do klientów nie są jeszcze dostępne." disabled><img src={clientAsset("chat-design.svg")} alt="" /></button>{selected.phone && <a className="client-contact" href={`tel:${selected.phone.replace(/[^+\d]/g, "")}`}>{selected.phone}</a>}{selected.email && <a className="client-contact" href={`mailto:${selected.email}`}>{selected.email}</a>}{!selected.email && !selected.phone && <p>Brak danych kontaktowych.</p>}</div>
          <ClientStatistics jobs={jobs} loading={jobsResource.loading} error={jobsResource.error} />
          <div className="client-section-heading"><h3>Informacje o kliencie</h3><button type="button" className="client-small-add" onClick={() => setEditor({ client: selected })}>Dodaj<img src={clientAsset("plus-design.svg")} alt="" /></button></div>
          {selected.notes && <article className="client-note"><div><strong>Notatki o kliencie</strong><button type="button" className="client-note-options" aria-label="Edytuj notatki o kliencie" onClick={() => setEditor({ client: selected })}><img src={clientAsset("note-options-design.svg")} alt="" /></button></div><p>{selected.notes}</p></article>}
          {(selected.street || selected.postalCode || selected.city) && <article className="client-note client-address"><div><strong>Adres klienta</strong></div><address>{selected.street && <span>{selected.street}<br /></span>}{[selected.postalCode, selected.city].filter(Boolean).join(" ")}</address></article>}
          {!selected.notes && !selected.street && !selected.postalCode && !selected.city && <p className="clients-panel-message">Brak dodatkowych informacji o kliencie.</p>}
        </section>
        <ClientOrders key={selected.id} jobs={jobs} loading={jobsResource.loading} error={jobsResource.error} reload={jobsResource.reload} openJob={job => setJobEditor({ job, clientId: selected.id })} />
      </> : <><section className="client-profile-card clients-no-selection"><h2>{clients.length ? "Nie znaleziono klienta" : "Twoja kartoteka klientów"}</h2><p>{clients.length ? "Wyszukaj klienta po nazwie, kontakcie lub adresie." : "Dodaj dane kontaktowe, adres i notatki, aby mieć je w jednym miejscu."}</p></section><ClientOrders jobs={[]} loading={false} error="" reload={jobsResource.reload} openJob={() => {}} /></>}
    </div>
    {editor && <ClientEditor client={editor.client} onClose={() => setEditor(null)} onReloaded={merge} onSaved={client => { merge(client); setSelectedId(client.id); setSearch(""); setEditor(null); setMessage("Dane klienta zostały zapisane."); }} />}
    {jobEditor && <ProviderJobEditor job={jobEditor.job} clientId={jobEditor.clientId} date={warsawToday()} onClose={() => setJobEditor(null)} onReloaded={jobsResource.reload} onSaved={() => { setJobEditor(null); jobsResource.reload(); setMessage("Zlecenie zostało zapisane."); }} />}
  </>;
}
export function ProviderClientsPage() {
  return <ProviderShell active="Klienci" figmaNode="4033:7754" live><ClientsContent /></ProviderShell>;
}
