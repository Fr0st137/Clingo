"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ProviderModal } from "./provider-modal";
import { ProviderShell } from "./provider-shell";
import { useSettingsResource, useUnsavedSettings } from "./provider-settings-state";
import { ApiError, providerApi } from "../lib/provider-client";
import { minorInput, offerCategories, offerPrice, priceMinor, type Offer, type OfferAddOn, type OfferAreaTier, type OfferConfiguration } from "../lib/provider-offers";

type ConfigDraft = Omit<OfferConfiguration, "ratePerSquareMeterMinor" | "travelRatePerKmMinor" | "durationPer100SquareMetersMinutes" | "addOns"> & {
  ratePerSquareMeter: string;
  travelRatePerKm: string;
  durationPer100SquareMeters: string;
  addOns: Array<Omit<OfferAddOn, "priceMinor"> & { price: string }>;
};

const addOnImages: Record<string, string> = {
  cabinets: "addon-01.png",
  windows: "addon-02.png",
  dishes: "addon-03.png",
  fridge: "addon-04.png",
  microwave: "addon-05.png",
  oven: "addon-07.png",
  litter: "addon-08.png",
  ironing: "addon-09.png",
  wardrobe: "addon-10.png",
  hood: "addon-12.png"
};

const toDraft = (configuration: OfferConfiguration): ConfigDraft => ({
  ...structuredClone(configuration),
  ratePerSquareMeter: minorInput(configuration.ratePerSquareMeterMinor),
  travelRatePerKm: minorInput(configuration.travelRatePerKmMinor),
  durationPer100SquareMeters: String(configuration.durationPer100SquareMetersMinutes),
  addOns: configuration.addOns.map(addOn => ({ ...addOn, price: minorInput(addOn.priceMinor) }))
});

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" className="offer-config-switch" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>;
}

function SectionTitle({ children, description }: { children: string; description?: string }) {
  return <div className="offer-config-section-title"><h2>{children}</h2>{description && <p>{description}</p>}</div>;
}

function Toolbar({ busy, dirty, save, preview, message }: { busy: boolean; dirty: boolean; save: () => void; preview: () => void; message: string }) {
  return <div className="offer-config-toolbar">
    <Link href="/services" className="offer-config-back" aria-label="Wróć do usług"><span aria-hidden="true">‹</span>Powrót</Link>
    <div className="offer-config-toolbar-actions">
      {message && <span className="offer-config-save-state" role="status">{message}</span>}
      <button type="button" className="offer-config-button is-secondary" onClick={preview}>Podgląd</button>
      <button type="button" className="offer-config-button is-secondary" disabled={busy || !dirty} onClick={save}>{busy ? "Zapisywanie..." : "Zapisz jako szkic"}</button>
      <button type="button" className="offer-config-button is-primary" disabled title="Publikacja będzie dostępna po uruchomieniu katalogu usług">Opublikuj</button>
    </div>
  </div>;
}

function OfferConfigEditor({ offer, reload, update }: { offer: Offer; reload: () => void; update: (offer: Offer) => void }) {
  const [original, setOriginal] = useState(offer);
  const [draft, setDraft] = useState(() => toDraft(offer.configuration));
  const [description, setDescription] = useState(offer.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addOnOpen, setAddOnOpen] = useState(false);
  const [newAddOn, setNewAddOn] = useState({ title: "", price: "", billingUnit: "piece" as "piece" | "halfHour" });
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const pending = useRef(false);
  const dirty = description !== original.description || JSON.stringify(draft) !== JSON.stringify(toDraft(original.configuration));
  useUnsavedSettings(dirty);
  const category = offerCategories.find(row => row.id === offer.category);
  const setConfig = <K extends keyof ConfigDraft>(key: K, value: ConfigDraft[K]) => { setDraft(previous => ({ ...previous, [key]: value })); setMessage(""); };
  useEffect(() => {
    if (offer.revision === original.revision) return;
    setOriginal(offer); setDraft(toDraft(offer.configuration)); setDescription(offer.description); setConflict(false); setError(""); setMessage("");
  }, [offer, original.revision]);

  function parseConfiguration(): OfferConfiguration | null {
    const rate = priceMinor(draft.ratePerSquareMeter);
    const travel = /^(?:0|0[.,]0{1,2})$/.test(draft.travelRatePerKm.trim()) ? 0 : priceMinor(draft.travelRatePerKm);
    const duration = Number(draft.durationPer100SquareMeters);
    const addOns = draft.addOns.map(addOn => ({ ...addOn, priceMinor: priceMinor(addOn.price) })).filter(addOn => addOn.priceMinor !== null);
    if (rate === null || travel === null) { setError("Podaj poprawne stawki w złotych, z maksymalnie dwoma miejscami po przecinku."); return null; }
    if (!Number.isInteger(duration) || duration < 15 || duration > 1440) { setError("Czas wykonania 100 m² musi wynosić od 15 do 1440 minut."); return null; }
    if (addOns.length !== draft.addOns.length) { setError("Każda usługa dodatkowa musi mieć poprawną cenę."); return null; }
    if (draft.areaTiers.some((tier, index) => tier.minSquareMeters < 1 || tier.workers < 1 || tier.workers > 50 || (tier.maxSquareMeters !== null && tier.maxSquareMeters < tier.minSquareMeters) || (index > 0 && tier.minSquareMeters !== (draft.areaTiers[index - 1].maxSquareMeters ?? -2) + 1))) { setError("Sprawdź ciągłość przedziałów powierzchni i liczbę pracowników."); return null; }
    return {
      ratePerSquareMeterMinor: rate,
      travelRatePerKmMinor: travel,
      durationPer100SquareMetersMinutes: duration,
      areaTiers: draft.areaTiers,
      leadTimeEnabled: draft.leadTimeEnabled,
      leadHours: draft.leadHours,
      bufferEnabled: draft.bufferEnabled,
      bufferMinutes: draft.bufferMinutes,
      vacuumIncluded: draft.vacuumIncluded,
      requiresClientPhotos: draft.requiresClientPhotos,
      recurringEnabled: draft.recurringEnabled,
      recurringDiscountPercent: draft.recurringDiscountPercent,
      addOns: addOns.map(({ price, ...addOn }) => ({ ...addOn, priceMinor: addOn.priceMinor! })),
      standardsAccepted: draft.standardsAccepted
    };
  }

  async function save() {
    if (pending.current || conflict || !dirty) return;
    setError(""); setMessage("");
    const configuration = parseConfiguration();
    if (!configuration) return;
    pending.current = true; setBusy(true);
    try {
      const saved = await providerApi<Offer>(`services/${offer.id}`, "PUT", {
        title: offer.title,
        category: offer.category,
        description,
        priceMinor: offer.priceMinor,
        durationMinutes: offer.durationMinutes,
        status: offer.status,
        configuration,
        revision: original.revision
      });
      setOriginal(saved); setDraft(toDraft(saved.configuration)); setDescription(saved.description); update(saved); setMessage("Szkic zapisany");
    } catch (caught) {
      setError((caught as Error).message);
      setConflict(caught instanceof ApiError && caught.status === 409);
    } finally { pending.current = false; setBusy(false); }
  }

  function updateTier(index: number, patch: Partial<OfferAreaTier>) {
    const next = draft.areaTiers.map((tier, tierIndex) => tierIndex === index ? { ...tier, ...patch } : { ...tier });
    if (patch.maxSquareMeters !== undefined && index + 1 < next.length && patch.maxSquareMeters !== null) next[index + 1].minSquareMeters = patch.maxSquareMeters + 1;
    setConfig("areaTiers", next);
  }
  function addTier() {
    const next = draft.areaTiers.map(tier => ({ ...tier }));
    const last = next[next.length - 1];
    if (last.maxSquareMeters === null) last.maxSquareMeters = last.minSquareMeters + 99;
    next.push({ minSquareMeters: last.maxSquareMeters + 1, maxSquareMeters: null, workers: last.workers });
    setConfig("areaTiers", next);
  }
  function removeTier(index: number) {
    if (draft.areaTiers.length === 1) return;
    const next = draft.areaTiers.filter((_, tierIndex) => tierIndex !== index).map(tier => ({ ...tier }));
    for (let i = 1; i < next.length; i += 1) if (next[i - 1].maxSquareMeters !== null) next[i].minSquareMeters = next[i - 1].maxSquareMeters! + 1;
    setConfig("areaTiers", next);
  }
  function formatDescription(prefix: string, suffix = prefix) {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = description.slice(start, end) || "tekst";
    const next = `${description.slice(0, start)}${prefix}${selection}${suffix}${description.slice(end)}`;
    setDescription(next.slice(0, 2000)); setMessage("");
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + prefix.length, start + prefix.length + selection.length); });
  }
  function createAddOn() {
    const cents = priceMinor(newAddOn.price);
    if (!newAddOn.title.trim() || cents === null) return;
    const id = `custom-${Date.now()}`;
    setConfig("addOns", [...draft.addOns, { id, title: newAddOn.title.trim().slice(0, 100), price: minorInput(cents), billingUnit: newAddOn.billingUnit }]);
    setNewAddOn({ title: "", price: "", billingUnit: "piece" }); setAddOnOpen(false);
  }

  const minutes = Number(draft.durationPer100SquareMeters);
  const previewPrice = priceMinor(draft.ratePerSquareMeter);
  const toolbarProps = { busy, dirty, save, preview: () => setPreviewOpen(true), message };
  return <section className="offer-config-page" aria-label={`Konfiguracja ogłoszenia ${offer.title}`} data-figma-node="4007:6672">
    <Toolbar {...toolbarProps} />
    <div className="offer-config-scroll">
      <header className="offer-config-hero">
        <img src={offer.category === "homes" || offer.category === "offices" ? "/figma-assets/services/config/header-cleaning.png" : `/figma-assets/services/${category?.image ?? "cleaning.png"}`} alt="" />
        <div><h1>{offer.title}</h1><p>{category?.detail ?? offer.category}</p><span><i />{offer.status === "archived" ? "Archiwum" : "Szkic"}</span></div>
      </header>

      <div className="offer-config-price-grid">
        <section className="offer-config-card offer-rate-card"><SectionTitle description="Cena naliczana za każdy metr kwadratowy powierzchni.">Stawka podstawowa</SectionTitle><label><input inputMode="decimal" value={draft.ratePerSquareMeter} onChange={event => setConfig("ratePerSquareMeter", event.target.value)} aria-label="Stawka za metr kwadratowy" /><span>zł / m²</span></label></section>
        <section className="offer-config-card offer-rate-card"><SectionTitle description="Koszt dojazdu poza obszarem bezpłatnym.">Stawka za dojazd</SectionTitle><label><input inputMode="decimal" value={draft.travelRatePerKm} onChange={event => setConfig("travelRatePerKm", event.target.value)} aria-label="Stawka za kilometr" /><span>zł / km</span></label></section>
      </div>

      <section className="offer-config-card offer-duration-card"><SectionTitle description="Określ orientacyjny czas potrzebny na wykonanie usługi.">Wydajność dla powierzchni 100 m²</SectionTitle><label><input type="number" min={15} max={1440} value={draft.durationPer100SquareMeters} onChange={event => setConfig("durationPer100SquareMeters", event.target.value)} aria-label="Czas wykonania w minutach" /><span>{Number.isFinite(minutes) ? `${Math.floor(minutes / 60)} godz. ${minutes % 60 ? `${minutes % 60} min` : ""}` : ""}</span></label></section>

      <section className="offer-config-card offer-tiers-card"><SectionTitle description="Ustal ilu pracowników przypisać automatycznie zależnie od metrażu.">Liczba pracowników a powierzchnia</SectionTitle>
        <div className="offer-tier-head"><span>Od</span><span>Do</span><span>Pracownicy</span><span /></div>
        <div className="offer-tier-list">{draft.areaTiers.map((tier, index) => <div className="offer-tier-row" key={`${index}-${tier.minSquareMeters}`}>
          <label><span className="sr-only">Powierzchnia od</span><input type="number" min={1} value={tier.minSquareMeters} readOnly /></label>
          <label><span className="sr-only">Powierzchnia do</span>{tier.maxSquareMeters === null ? <span className="offer-tier-open">bez limitu</span> : <input type="number" min={tier.minSquareMeters} max={10000} value={tier.maxSquareMeters} onChange={event => updateTier(index, { maxSquareMeters: Number(event.target.value) })} />}</label>
          <div className="offer-worker-stepper"><button type="button" aria-label="Zmniejsz liczbę pracowników" onClick={() => updateTier(index, { workers: Math.max(1, tier.workers - 1) })}>−</button><strong>{tier.workers}</strong><button type="button" aria-label="Zwiększ liczbę pracowników" onClick={() => updateTier(index, { workers: Math.min(50, tier.workers + 1) })}>+</button></div>
          <button type="button" className="offer-tier-remove" aria-label="Usuń przedział" disabled={draft.areaTiers.length === 1} onClick={() => removeTier(index)}>×</button>
        </div>)}</div>
        <button type="button" className="offer-config-add" onClick={addTier}>+ Dodaj przedział</button>
        <p className="offer-config-info">Przedziały muszą tworzyć ciągłą skalę. Zmiana górnej granicy automatycznie aktualizuje kolejny próg.</p>
      </section>

      <section className="offer-config-card"><SectionTitle description="Zdecyduj, z jakim wyprzedzeniem klient może zarezerwować usługę.">Ustawienia kalendarza</SectionTitle>
        <div className="offer-config-setting"><div><strong>Wyprzedzenie zamówienia</strong><span>Minimalny czas przed rozpoczęciem usługi</span></div>{draft.leadTimeEnabled && <label><input type="number" min={1} max={720} value={draft.leadHours} onChange={event => setConfig("leadHours", Number(event.target.value))} /><span>godz.</span></label>}<Switch label="Wyprzedzenie zamówienia" checked={draft.leadTimeEnabled} onChange={value => setConfig("leadTimeEnabled", value)} /></div>
        <div className="offer-config-setting"><div><strong>Bufor między zleceniami</strong><span>Czas na dojazd i przygotowanie</span></div>{draft.bufferEnabled && <label><input type="number" min={0} max={240} step={5} value={draft.bufferMinutes} onChange={event => setConfig("bufferMinutes", Number(event.target.value))} /><span>min</span></label>}<Switch label="Bufor między zleceniami" checked={draft.bufferEnabled} onChange={value => setConfig("bufferEnabled", value)} /></div>
      </section>

      <section className="offer-config-card"><SectionTitle description="Określ wymagania dotyczące sprzętu i przygotowania klienta.">Sprzęt i przygotowanie</SectionTitle>
        <div className="offer-config-setting"><div><strong>Odkurzacz po stronie wykonawcy</strong><span>Pracownik przywozi własny odkurzacz</span></div><Switch label="Odkurzacz po stronie wykonawcy" checked={draft.vacuumIncluded} onChange={value => setConfig("vacuumIncluded", value)} /></div>
        <div className="offer-config-setting"><div><strong>Zdjęcia od klienta</strong><span>Klient dodaje zdjęcia przed rezerwacją</span></div><Switch label="Zdjęcia od klienta" checked={draft.requiresClientPhotos} onChange={value => setConfig("requiresClientPhotos", value)} /></div>
      </section>

      <section className="offer-config-card"><SectionTitle description="Pozwól klientom zamawiać usługę regularnie ze stałym rabatem.">Usługi cykliczne</SectionTitle>
        <div className="offer-config-setting"><div><strong>Włącz rezerwacje cykliczne</strong><span>Klient wybierze powtarzalny termin</span></div>{draft.recurringEnabled && <label><span>−</span><input type="number" min={0} max={90} value={draft.recurringDiscountPercent} onChange={event => setConfig("recurringDiscountPercent", Number(event.target.value))} /><span>%</span></label>}<Switch label="Usługi cykliczne" checked={draft.recurringEnabled} onChange={value => setConfig("recurringEnabled", value)} /></div>
      </section>

      <section className="offer-config-card offer-addons-card"><div className="offer-config-section-row"><SectionTitle description="Dodatki, które klient może dobrać podczas zamówienia.">Usługi dodatkowe</SectionTitle><button type="button" className="offer-config-add" onClick={() => setAddOnOpen(true)}>+ Dodaj usługę dodatkową</button></div>
        <div className="offer-addon-grid">{draft.addOns.map((addOn, index) => <article className="offer-addon" key={addOn.id}>
          {addOnImages[addOn.id] ? <img src={`/figma-assets/services/config/${addOnImages[addOn.id]}`} alt="" /> : <span className="offer-addon-placeholder">+</span>}
          <button type="button" className="offer-addon-remove" aria-label={`Usuń ${addOn.title}`} onClick={() => setConfig("addOns", draft.addOns.filter((_, rowIndex) => rowIndex !== index))}>×</button>
          <strong>{addOn.title}</strong><label><span className="sr-only">Cena za {addOn.title}</span><input inputMode="decimal" value={addOn.price} onChange={event => setConfig("addOns", draft.addOns.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))} /><span>zł / {addOn.billingUnit === "piece" ? "szt." : "30 min"}</span></label>
        </article>)}</div>
      </section>

      <section className="offer-config-card offer-presentation-card"><SectionTitle description="Przedstaw klientowi zakres pracy i najważniejsze informacje.">Prezentacja usługi</SectionTitle>
        <div className="offer-description-editor"><div className="offer-description-toolbar" aria-label="Formatowanie opisu"><button type="button" aria-label="Pogrubienie" onClick={() => formatDescription("**")}>B</button><button type="button" aria-label="Kursywa" onClick={() => formatDescription("_")}><i>I</i></button><button type="button" aria-label="Podkreślenie" onClick={() => formatDescription("<u>", "</u>")}><u>U</u></button><button type="button" aria-label="Przekreślenie" onClick={() => formatDescription("~~")}><s>S</s></button><button type="button" aria-label="Lista" onClick={() => formatDescription("- ", "")}>☷</button></div><textarea ref={descriptionRef} maxLength={2000} value={description} onChange={event => { setDescription(event.target.value); setMessage(""); }} placeholder="Opisz zakres usługi, używane środki i ważne informacje dla klienta." /><small>{description.length}/2000</small></div>
        <div className="offer-media-grid"><div><h3>Baner ogłoszenia</h3><div className="offer-media-drop"><strong>Dodaj zdjęcie w formacie JPG lub PNG</strong><span>Obsługa własnych zdjęć będzie dostępna wraz z publikacją katalogu.</span><button type="button" disabled>Dodaj zdjęcie</button></div></div><div><h3>Galeria</h3><div className="offer-media-drop is-gallery"><strong>Dodaj zdjęcia realizacji</strong><span>Zdjęcia nie są jeszcze wysyłane do publicznego katalogu.</span><button type="button" disabled>Dodaj zdjęcia</button></div></div></div>
      </section>

      <section className="offer-config-card offer-standards"><label><input type="checkbox" checked={draft.standardsAccepted} onChange={event => setConfig("standardsAccepted", event.target.checked)} /><span>Akceptuję standard wykonania usługi i potwierdzam, że opis jest zgodny z ofertą.</span></label></section>
      {error && <div className="provider-feedback is-error offer-config-feedback" role="alert">{error}{conflict && <button type="button" className="settings-button" onClick={reload}>Wczytaj aktualne dane</button>}</div>}
      <Toolbar {...toolbarProps} />
    </div>

    {previewOpen && <ProviderModal className="offer-preview-modal" titleId="offer-preview-title" onClose={() => setPreviewOpen(false)}><h2 id="offer-preview-title">Podgląd ogłoszenia</h2><div className="offer-preview-heading"><img src="/figma-assets/services/config/header-cleaning.png" alt="" /><div><strong>{offer.title}</strong><span>{category?.detail}</span></div></div><p>{description || "Brak opisu usługi."}</p><dl><div><dt>Stawka</dt><dd>{previewPrice === null ? "Nieprawidłowa" : `${offerPrice(previewPrice)} / m²`}</dd></div><div><dt>Czas dla 100 m²</dt><dd>{draft.durationPer100SquareMeters} min</dd></div><div><dt>Dodatki</dt><dd>{draft.addOns.length}</dd></div></dl></ProviderModal>}
    {addOnOpen && <ProviderModal className="offer-addon-modal" titleId="add-on-title" onClose={() => setAddOnOpen(false)}><h2 id="add-on-title">Dodaj usługę dodatkową</h2><label className="settings-live-field"><span>Nazwa</span><input maxLength={100} value={newAddOn.title} onChange={(event: ChangeEvent<HTMLInputElement>) => setNewAddOn(previous => ({ ...previous, title: event.target.value }))} /></label><label className="settings-live-field"><span>Cena (zł)</span><input inputMode="decimal" value={newAddOn.price} onChange={(event: ChangeEvent<HTMLInputElement>) => setNewAddOn(previous => ({ ...previous, price: event.target.value }))} /></label><label className="settings-live-field"><span>Sposób rozliczania</span><select value={newAddOn.billingUnit} onChange={event => setNewAddOn(previous => ({ ...previous, billingUnit: event.target.value as "piece" | "halfHour" }))}><option value="piece">za sztukę</option><option value="halfHour">za 30 minut</option></select></label><div className="settings-live-actions"><button type="button" className="settings-button" onClick={() => setAddOnOpen(false)}>Anuluj</button><button type="button" className="employee-save-button" disabled={!newAddOn.title.trim() || priceMinor(newAddOn.price) === null} onClick={createAddOn}>Dodaj</button></div></ProviderModal>}
  </section>;
}

function ServiceConfig({ serviceId }: { serviceId: string }) {
  const resource = useSettingsResource<Offer>(`services/${serviceId}`);
  if (resource.loading || resource.error || !resource.data) return <div className="provider-state" role={resource.error ? "alert" : "status"}>{resource.loading ? "Wczytywanie ogłoszenia..." : <><p>{resource.error || "Nie znaleziono ogłoszenia."}</p><Link className="settings-button" href="/services">Wróć do usług</Link></>}</div>;
  return <OfferConfigEditor key={resource.data.id} offer={resource.data} reload={resource.reload} update={resource.setData} />;
}

export function ProviderServiceConfigPage({ serviceId }: { serviceId: string }) {
  return <ProviderShell active="Twoje usługi" live figmaNode="4007:6672"><ServiceConfig serviceId={serviceId} /></ProviderShell>;
}
