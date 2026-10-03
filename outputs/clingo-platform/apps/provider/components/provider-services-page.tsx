"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ProviderShell } from "./provider-shell";
import { ProviderModal } from "./provider-modal";
import { SettingsInput, useSettingsResource, useUnsavedSettings } from "./provider-settings-state";
import { ApiError, normalized, providerApi } from "../lib/provider-client";
import { offerCategories, offerDraft, offerPrice, priceMinor, type Offer } from "../lib/provider-offers";

function OfferEditor({ offer, close, saved, refreshed }: { offer?: Offer; close: () => void; saved: (offer: Offer) => void; refreshed: (offer: Offer) => void }) {
  const [original, setOriginal] = useState(offer);
  const [draft, setDraft] = useState(() => offerDraft(offer));
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState<"close" | "reload" | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(offerDraft(original));
  useUnsavedSettings(dirty);
  const change = (key: keyof typeof draft, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  const requestClose = () => { if (!pending.current) { if (dirty) setConfirm("close"); else close(); } };
  async function discard() {
    if (confirm === "close") { close(); return; }
    if (!original || pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try { const fresh = await providerApi<Offer>(`services/${original.id}`); setOriginal(fresh); setDraft(offerDraft(fresh)); refreshed(fresh); setConflict(false); setConfirm(null); }
    catch (error) { setError((error as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending.current || conflict || !dirty) return;
    const cents = priceMinor(draft.price);
    if (cents === null) { setError("Podaj cenę od 0,01 do 100 000 zł, z maksymalnie dwoma miejscami po przecinku."); return; }
    if (!/^\d+$/.test(draft.duration) || Number(draft.duration) < 15 || Number(draft.duration) > 1440) { setError("Czas trwania musi wynosić od 15 do 1440 minut."); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      const data = { title: draft.title, category: draft.category, description: draft.description, priceMinor: cents, durationMinutes: Number(draft.duration), status: draft.status, ...(original ? { revision: original.revision, configuration: original.configuration } : {}) };
      saved(await providerApi<Offer>(original ? `services/${original.id}` : "services", original ? "PUT" : "POST", data));
    } catch (error) { setError((error as Error).message); setConflict(error instanceof ApiError && error.status === 409); }
    finally { pending.current = false; setBusy(false); }
  }
  return <ProviderModal className="client-editor" titleId="offer-editor-title" onClose={requestClose}>
    <h2 id="offer-editor-title">{confirm ? "Odrzucić zmiany?" : original ? "Edytuj usługę" : "Dodaj usługę"}</h2>
    {confirm ? <><p>{confirm === "reload" ? "Formularz zostanie zastąpiony ostatnią zapisaną wersją." : "Niezapisane zmiany zostaną utracone."}</p>{error && <p role="alert">{error}</p>}<div className="settings-live-actions"><button className="settings-button" disabled={busy} onClick={() => setConfirm(null)}>Wróć do edycji</button><button className="employee-save-button" disabled={busy} onClick={discard}>{busy ? "Wczytywanie…" : confirm === "reload" ? "Odrzuć zmiany i wczytaj" : "Odrzuć zmiany"}</button></div></> : <form onSubmit={submit}>
      <p>Usługa będzie zapisana w Twojej działalności. Szkice nie są widoczne w katalogu klientów.</p>
      <fieldset className="settings-live-fields" disabled={busy}>
        <SettingsInput label="Nazwa usługi" value={draft.title} onChange={e => change("title", e.target.value)} required maxLength={180} />
        <label className="settings-live-field"><span>Kategoria</span><select value={draft.category} onChange={e => change("category", e.target.value)}>{offerCategories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
        <SettingsInput label="Cena za usługę (zł)" inputMode="decimal" value={draft.price} onChange={e => change("price", e.target.value)} required maxLength={9} placeholder="np. 149,90" />
        <SettingsInput label="Czas trwania (minuty)" type="number" min={15} max={1440} step={1} value={draft.duration} onChange={e => change("duration", e.target.value)} required />
        <label className="settings-live-field client-notes-field"><span>Opis i zakres usługi</span><textarea rows={5} maxLength={2000} value={draft.description} onChange={e => change("description", e.target.value)} /><small>{draft.description.length}/2000 znaków</small></label>
        {original && <label className="settings-live-field"><span>Status</span><select value={draft.status} onChange={e => change("status", e.target.value)}><option value="draft">Szkic</option><option value="archived">Archiwum</option></select><small>Przeniesienie do archiwum zachowuje dane. Możesz później przywrócić szkic.</small></label>}
      </fieldset>
      {error && <div className="provider-feedback is-error" role="alert">{error}{conflict && <button type="button" className="settings-button" onClick={() => setConfirm("reload")}>Wczytaj aktualne dane</button>}</div>}
      <div className="settings-live-actions"><button type="button" className="settings-button" disabled={busy} onClick={requestClose}>Anuluj</button><button className="employee-save-button" disabled={busy || conflict || !dirty}>{busy ? "Zapisywanie…" : "Zapisz usługę"}</button></div>
    </form>}
  </ProviderModal>;
}
function Services() {
  const resource = useSettingsResource<Offer[]>("services");
  const [editor, setEditor] = useState<{ offer?: Offer } | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"draft" | "archived">("draft");
  const [message, setMessage] = useState("");
  const offers = resource.data ?? [];
  const filtered = offers.filter(offer => offer.status === filter && normalized(`${offer.title} ${offerCategories.find(category => category.id === offer.category)?.label ?? ""} ${offer.description}`).includes(normalized(query.trim()))).sort((a, b) => offerCategories.findIndex(category => category.id === a.category) - offerCategories.findIndex(category => category.id === b.category) || a.title.localeCompare(b.title, "pl") || a.id.localeCompare(b.id));
  function merge(offer: Offer) { resource.setData(previous => [...(previous ?? []).filter(row => row.id !== offer.id), offer].sort((a,b) => a.title.localeCompare(b.title, "pl") || a.id.localeCompare(b.id))); }
  if (resource.loading || resource.error) return <div className="provider-state" role={resource.error ? "alert" : "status"}>{resource.loading ? "Wczytywanie usług…" : <><p>{resource.error}</p><button className="settings-button" onClick={resource.reload}>Spróbuj ponownie</button></>}</div>;
  return <section className="services-content services-live" aria-labelledby="services-title" data-figma-node="3556:5467">
    <img className="services-background" src="/figma-assets/services/background.png" alt="" />
    <div className="services-heading"><h1 id="services-title">Twoje usługi</h1><div><p>Konfiguruj, dodawaj i usuwaj usługi z jakimi chcesz się ogłaszać.</p><button type="button" className="add-service-button" onClick={() => { setMessage(""); setEditor({}); }}>Dodaj ogłoszenie<img src="/figma-assets/services/plus.svg" alt="" /></button></div></div>
    <div className="services-results">
      <div className="services-grid">{filtered.map(offer => { const category = offerCategories.find(category => category.id === offer.category); return <Link className="service-card" key={offer.id} aria-label={`Edytuj usługę: ${offer.title}, ${category?.detail ?? offer.category}`} title={`${offer.title} · ${offerPrice(offer.priceMinor)} · ${offer.durationMinutes} min`} href={`/services/${offer.id}`}>
        {category && <img className="service-image" src={`/figma-assets/services/${category.image}`} alt="" />}
        <span className="service-card-copy"><span className="service-card-name"><span className="service-status is-draft"><img src="/figma-assets/services/status-draft.svg" alt="" />{offer.status === "draft" ? "Szkic" : "Archiwum"}</span><span className="service-category">{offer.title}</span></span><span className="service-detail">{category?.detail ?? offer.category}</span></span>
      </Link>; })}</div>
      {!filtered.length && <div className="provider-state" role="status">{query ? "Brak usług pasujących do wyszukiwania." : filter === "archived" ? "Archiwum jest puste." : "Nie masz jeszcze szkiców usług. Dodaj pierwszą usługę."}</div>}
    </div>
    <div className="offer-toolbar"><label className="settings-live-field"><span className="sr-only">Szukaj usługi</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj usługi" /></label><div className="offer-tabs" role="group" aria-label="Status usług">{(["draft", "archived"] as const).map(status => <button type="button" key={status} className="settings-button" aria-pressed={filter === status} onClick={() => setFilter(status)}>{status === "draft" ? "Szkice" : "Archiwum"} ({offers.filter(offer => offer.status === status).length})</button>)}</div><button type="button" className="settings-button" onClick={resource.reload}>Odśwież</button></div>
    {message && <p role="status" className="services-save-message">{message}</p>}
    {editor && <OfferEditor offer={editor.offer} close={() => setEditor(null)} refreshed={merge} saved={offer => { merge(offer); setFilter(offer.status); setQuery(""); setEditor(null); setMessage(offer.status === "archived" ? "Usługa została zapisana w archiwum." : "Szkic usługi został zapisany."); }} />}
  </section>;
}
export function ProviderServicesPage() { return <ProviderShell active="Twoje usługi" live><Services /></ProviderShell>; }
