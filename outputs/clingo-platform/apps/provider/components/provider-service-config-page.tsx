"use client";
import "../app/service-config.css";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ProviderModal } from "./provider-modal";
import { ProviderShell } from "./provider-shell";
import { ProviderOfferMedia } from "./provider-offer-media";
import { ProviderOfferDescription } from "./provider-offer-description";
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
const asset = (name: string) => `/figma-assets/services/editor/${name}`;
const designAddOnImages: Record<string, string> = { windows: "addon-1.png", fridge: "addon-2.png", dishes: "addon-3.png", oven: "addon-4.png", hood: "addon-5.png", microwave: "addon-6.png", ironing: "addon-7.png", wardrobe: "addon-8.png", cabinets: "addon-9.png", litter: "addon-10.png", balcony: "addon-7.png" };
const addOnCatalog: OfferAddOn[] = [
  { id: "windows", title: "Mycie okien", priceMinor: 2000, billingUnit: "piece" },
  { id: "fridge", title: "Czyszczenie lodówki", priceMinor: 2500, billingUnit: "piece" },
  { id: "dishes", title: "Mycie naczyń", priceMinor: 3000, billingUnit: "halfHour" },
  { id: "oven", title: "Mycie piekarnika", priceMinor: 3000, billingUnit: "piece" },
  { id: "hood", title: "Mycie okapu", priceMinor: 1500, billingUnit: "piece" },
  { id: "microwave", title: "Mycie mikrofalówki", priceMinor: 1500, billingUnit: "piece" },
  { id: "ironing", title: "Prasowanie", priceMinor: 3000, billingUnit: "halfHour" },
  { id: "wardrobe", title: "Sprzątanie i mycie wnętrza szafy", priceMinor: 3000, billingUnit: "piece" },
  { id: "cabinets", title: "Sprzątanie wnętrza szafek", priceMinor: 4500, billingUnit: "piece" },
  { id: "litter", title: "Sprzątanie kuwety", priceMinor: 1000, billingUnit: "piece" },
  { id: "balcony", title: "Sprzątanie i mycie balkonu", priceMinor: 3000, billingUnit: "piece" }
];

const toDraft = (configuration: OfferConfiguration): ConfigDraft => ({
  ...structuredClone(configuration),
  ratePerSquareMeter: minorInput(configuration.ratePerSquareMeterMinor),
  travelRatePerKm: minorInput(configuration.travelRatePerKmMinor),
  durationPer100SquareMeters: String(configuration.durationPer100SquareMetersMinutes),
  addOns: configuration.addOns.map(addOn => ({ ...addOn, price: minorInput(addOn.priceMinor) }))
});

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" className="offer-config-switch" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><img src={asset(checked ? "switch-on.svg" : "switch-off.svg")} alt="" /></button>;
}

function SectionTitle({ children, description }: { children: string; description?: string }) {
  return <div className="offer-config-section-title"><h2>{children}</h2>{description && <p>{description}</p>}</div>;
}

function Toolbar({ busy, dirty, save, publish, published, preview, message }: { busy: boolean; dirty: boolean; save: () => void; publish: () => void; published: boolean; preview: () => void; message: string }) {
  return <div className="offer-config-toolbar">
    <Link href="/services" className="offer-config-back" aria-label="Wróć do usług"><img src={asset("back.svg")} alt="" />Powrót</Link>
    <div className="offer-config-toolbar-actions">
      {message && <span className="offer-config-save-state" role="status">{message}</span>}
      <button type="button" className="offer-config-button is-primary" onClick={preview}>Podgląd<img src={asset("preview.svg")} alt="" /></button>
      <button type="button" className="offer-config-button is-secondary" disabled={busy} onClick={save}>Zapisz jako szkic<img src={asset("draft.svg")} alt="" /></button>
      <button type="button" className="offer-config-button is-primary" disabled={busy || (published && !dirty)} onClick={publish}>Opublikuj<img src={asset("publish.svg")} alt="" /></button>
    </div>
  </div>;
}

function OfferConfigEditor({ offer, reload, update }: { offer: Offer; reload: () => void; update: (offer: Offer) => void }) {
  const [original, setOriginal] = useState(offer);
  const [draft, setDraft] = useState(() => toDraft(offer.configuration));
  const [description, setDescription] = useState(offer.description);
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addOnOpen, setAddOnOpen] = useState(false);
  const [addOnTemplate, setAddOnTemplate] = useState("");
  const [standardsOpen, setStandardsOpen] = useState(false);
  const [newAddOn, setNewAddOn] = useState({ title: "", price: "", billingUnit: "piece" as "piece" | "halfHour" });
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const pending = useRef(false);
  const dirty = description !== original.description || JSON.stringify(draft) !== JSON.stringify(toDraft(original.configuration));
  useUnsavedSettings(dirty);
  const category = offerCategories.find(row => row.id === offer.category);
  const availableAddOns = addOnCatalog.filter(row => !draft.addOns.some(selected => selected.id === row.id));
  const orderedAddOns = draft.addOns.map((addOn, index) => ({ addOn, index })).sort((a, b) => {
    const order = (id: string) => { const index = addOnCatalog.findIndex(row => row.id === id); return index < 0 ? 100 : index; };
    return order(a.addOn.id) - order(b.addOn.id);
  });
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
    if (draft.areaTiers.length > 12 || draft.areaTiers.some((tier, index) => !Number.isSafeInteger(tier.minSquareMeters) || !Number.isSafeInteger(tier.workers) || tier.minSquareMeters < 1 || tier.minSquareMeters > 10000 || tier.workers < 1 || tier.workers > 50 || (tier.maxSquareMeters !== null && (!Number.isSafeInteger(tier.maxSquareMeters) || tier.maxSquareMeters < tier.minSquareMeters || tier.maxSquareMeters > 10000)) || (index > 0 && tier.minSquareMeters !== (draft.areaTiers[index - 1].maxSquareMeters ?? -2) + 1))) { setError("Sprawdź ciągłość przedziałów powierzchni i liczbę pracowników."); return null; }
    return {
      ...(draft.presentation ? { presentation: draft.presentation } : {}),
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

  async function save(status: Offer["status"]) {
    if (pending.current || mediaBusy || conflict) return;
    if (!dirty && status === original.status) { setMessage(status === "draft" ? "Szkic zapisany" : "Ogłoszenie opublikowane"); return; }
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
        status,
        configuration,
        revision: original.revision
      });
      setOriginal(saved); setDraft(toDraft(saved.configuration)); setDescription(saved.description); update(saved); setMessage(status === "published" ? "Ogłoszenie opublikowane" : "Szkic zapisany — niewidoczny dla klientów");
    } catch (caught) {
      setError((caught as Error).message);
      setConflict(caught instanceof ApiError && caught.status === 409);
    } finally { pending.current = false; setBusy(false); }
  }

  function updateTier(index: number, patch: Partial<OfferAreaTier>) {
    const next = draft.areaTiers.map((tier, tierIndex) => tierIndex === index ? { ...tier, ...patch } : { ...tier });
    if (patch.maxSquareMeters !== undefined && patch.maxSquareMeters !== null) for (let i = index + 1; i < next.length; i++) {
      next[i].minSquareMeters = next[i - 1].maxSquareMeters! + 1;
      if (next[i].maxSquareMeters !== null && next[i].maxSquareMeters! < next[i].minSquareMeters) next[i].maxSquareMeters = next[i].minSquareMeters;
    }
    setConfig("areaTiers", next);
  }
  function addTier() {
    if (draft.areaTiers.length >= 12) return;
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
    const selection = description.slice(start, end) || (suffix === "" ? "" : "tekst");
    const next = `${description.slice(0, start)}${prefix}${selection}${suffix}${description.slice(end)}`;
    setDescription(next.slice(0, 2000)); setMessage("");
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + prefix.length, start + prefix.length + selection.length); });
  }
  function createAddOn() {
    const cents = priceMinor(newAddOn.price);
    if (!newAddOn.title.trim() || cents === null || draft.addOns.length >= 20) return;
    const id = addOnTemplate || `custom-${crypto.randomUUID()}`;
    setConfig("addOns", [...draft.addOns, { id, title: newAddOn.title.trim().slice(0, 100), price: minorInput(cents), billingUnit: newAddOn.billingUnit }]);
    setNewAddOn({ title: "", price: "", billingUnit: "piece" }); setAddOnTemplate(""); setAddOnOpen(false);
  }

  const previewPrice = priceMinor(draft.ratePerSquareMeter);
  const toolbarProps = { busy: busy || mediaBusy, dirty, save: () => save("draft"), publish: () => save("published"), published: original.status === "published", preview: () => setPreviewOpen(true), message };
  return <section className="offer-config-page is-figma" aria-label={`Konfiguracja ogłoszenia ${offer.title}`} data-figma-node="4007:6672">
    <Toolbar {...toolbarProps} />
    <div className="offer-config-scroll" inert={busy}>
      <header className="offer-config-hero">
        <img src={offer.category === "homes" || offer.category === "offices" ? asset("cleaning.png") : `/figma-assets/services/${category?.image ?? "cleaning.png"}`} alt="" />
        <div><h1>{offer.title}<span> · {category?.detail ?? offer.category}</span></h1><p>Skonfiguruj i opublikuj usługę, aby klienci mogli zacząć składać rezerwacje.</p></div>
      </header>
      <div className="offer-config-price-grid">
        <section className="offer-config-card offer-rate-card"><SectionTitle description="Wprowadź kwotę, jaką chcesz oferować za 1 m² sprzątanej powierzchni.">Stawka za podstawową usługę</SectionTitle><label className="offer-inline-field"><span>Cena za 1 m²</span><span className="offer-value-control"><input inputMode="decimal" value={draft.ratePerSquareMeter} onChange={event => setConfig("ratePerSquareMeter", event.target.value)} aria-label="Stawka za metr kwadratowy" /><span>zł</span><img src={asset("wallet.svg")} alt="" /></span></label></section>
        <section className="offer-config-card offer-rate-card"><SectionTitle description="Kwota, jaką sobie liczysz za 1 kilometr w ramach dojazdu do klienta.">Stawka za dojazd</SectionTitle><label className="offer-inline-field"><span>Cena za 1 km</span><span className="offer-value-control"><input inputMode="decimal" value={draft.travelRatePerKm} onChange={event => setConfig("travelRatePerKm", event.target.value)} aria-label="Stawka za kilometr" /><span>zł</span><img src={asset("wallet.svg")} alt="" /></span></label></section>
      </div>
      <section className="offer-config-card offer-duration-card"><SectionTitle description="Określa średnią ilość czasu potrzebną na wykonanie danej usługi przez 1 pracownika.">Wydajność na 1 pracownika</SectionTitle><label className="offer-inline-field"><span>Wykonanie usługi dla 100m² obiektu</span><span className="offer-value-control"><input type="number" min={.25} max={24} step={.25} value={draft.durationPer100SquareMeters === "" ? "" : Number(draft.durationPer100SquareMeters) / 60} onChange={event => setConfig("durationPer100SquareMeters", event.target.value === "" ? "" : String(Math.round(Number(event.target.value) * 60)))} aria-label="Czas wykonania w godzinach" /><span>h</span><img src={asset("clock.svg")} alt="" /></span></label></section>
      <section className="offer-config-card offer-tiers-card"><div className="offer-tiers-heading"><h2>Widełki metrażowe</h2><img src={asset("info.svg")} alt="" title="Przedziały określają obsługiwany metraż i średnią liczbę pracowników." /></div><p className="offer-section-help">Ustaw średnią liczbę pracowników, która ma realizować zlecenie w zależności od metrażu lokalu. Określ także minimalny i maksymalny obsługiwany metraż.</p>
        <div className="offer-tier-list">{draft.areaTiers.map((tier, index) => <div className="offer-tier-row" key={index}>
          <div className="offer-tier-fields"><span>Dla lokalu od</span>
          <label className="offer-area-control"><input aria-label={`Powierzchnia od — przedział ${index + 1}`} type="number" min={1} max={10000} value={tier.minSquareMeters} readOnly={index > 0} onChange={event => updateTier(index, { minSquareMeters: Number(event.target.value) })} /><span>m²</span></label><span>do</span>
          <label className="offer-area-control"><input aria-label={`Powierzchnia do — przedział ${index + 1}`} inputMode="numeric" value={tier.maxSquareMeters ?? "Bez limitu"} onChange={event => updateTier(index, { maxSquareMeters: index === draft.areaTiers.length - 1 && (!event.target.value || /bez limitu/i.test(event.target.value)) ? null : Number(event.target.value.replace(/\D/g, "")) })} /><span>m²</span></label><span>przypisz</span>
          <div className="offer-worker-stepper"><button type="button" aria-label={`Zmniejsz liczbę pracowników — przedział ${index + 1}`} disabled={tier.workers <= 1} onClick={() => updateTier(index, { workers: Math.max(1, tier.workers - 1) })}><img src={asset("minus.svg")} alt="" /></button><strong>{tier.workers}</strong><button type="button" aria-label={`Zwiększ liczbę pracowników — przedział ${index + 1}`} disabled={tier.workers >= 50} onClick={() => updateTier(index, { workers: Math.min(50, tier.workers + 1) })}><img src={asset("plus.svg")} alt="" /></button></div><span>Pracownika/ów</span></div>
          <button type="button" className="offer-tier-remove" aria-label={`Usuń przedział ${index + 1}`} disabled={draft.areaTiers.length === 1} onClick={() => removeTier(index)}><img src={asset("trash.svg")} alt="" /></button>
        </div>)}<button type="button" className="offer-config-add" disabled={draft.areaTiers.length >= 12} onClick={addTier}><img src={asset("add-tier.svg")} alt="" />Dodaj przedział</button></div>
        <p className="offer-config-info"><img src={asset("info-blue.svg")} alt="" />Przy obecnych ustawieniach obsługujesz zlecenia od {draft.areaTiers[0].minSquareMeters} m². {draft.areaTiers.at(-1)?.maxSquareMeters === null ? `Dla lokali powyżej ${draft.areaTiers.at(-1)!.minSquareMeters} m² system przypisze ${draft.areaTiers.at(-1)!.workers} pracowników.` : `Maksymalny obsługiwany metraż: ${draft.areaTiers.at(-1)?.maxSquareMeters} m².`}</p>
        <p className="offer-config-info is-warning"><img src={asset("warning.svg")} alt="" />Klienci szukający usług dla lokali poniżej {draft.areaTiers[0].minSquareMeters} m² nie zobaczą Twojego ogłoszenia.</p>
      </section>
      <section className="offer-config-card offer-options-card"><SectionTitle description="Ustaw bufor między zleceniami i wyprzedzenie zamówienia.">Harmonogram</SectionTitle>
        <div className="offer-config-setting"><Switch label="Wyprzedzenie zamówienia" checked={draft.leadTimeEnabled} onChange={value => setConfig("leadTimeEnabled", value)} /><div><strong>Wyprzedzenie zamówienia</strong><span>Aktywuj, aby określić, ile czasu przed rozpoczęciem usługi klient musi złożyć zamówienie.</span></div>{draft.leadTimeEnabled && <label className="offer-value-control"><input aria-label="Wyprzedzenie w godzinach" type="number" min={1} max={720} value={draft.leadHours} onChange={event => setConfig("leadHours", Number(event.target.value))} /><span>godz.</span></label>}</div>
        <div className="offer-config-setting"><Switch label="Bufor między zleceniami" checked={draft.bufferEnabled} onChange={value => setConfig("bufferEnabled", value)} /><div><strong>Bufor między zleceniami</strong><span>Aktywuj, aby ustawić minimalny odstęp czasowy między kolejnymi zleceniami i zapobiec ich planowaniu bezpośrednio jedno po drugim.</span></div>{draft.bufferEnabled && <label className="offer-value-control"><input aria-label="Bufor w minutach" type="number" min={0} max={240} step={5} value={draft.bufferMinutes} onChange={event => setConfig("bufferMinutes", Number(event.target.value))} /><span>min</span><img src={asset("clock.svg")} alt="" /></label>}</div>
      </section>
      <section className="offer-config-card offer-options-card"><SectionTitle description="Zaznacz, co zapewniasz i co wymagasz od klienta.">Wyposażenie i wymagania</SectionTitle>
        <div className="offer-config-setting"><Switch label="Odkurzacz po stronie wykonawcy" checked={draft.vacuumIncluded} onChange={value => setConfig("vacuumIncluded", value)} /><div><strong>Odkurzacz zapewniany przez wykonawcę</strong><span>Zaznacz, jeśli możesz udostępnić odkurzacz w ramach usługi.</span></div></div>
        <div className="offer-config-setting"><Switch label="Zdjęcia od klienta" checked={draft.requiresClientPhotos} onChange={value => setConfig("requiresClientPhotos", value)} /><div><strong>Wymaganie dodania zdjęć lokalu</strong><span>Włącz tę opcję, jeśli chcesz, aby klient podczas składania zamówienia musiał dodać zdjęcia lokalu.</span></div></div>
      </section>
      <section className="offer-config-card offer-options-card"><SectionTitle description="Zaznacz, jeśli chcesz oferować usługi cykliczne i ustal rabaty.">Usługi cykliczne</SectionTitle>
        <div className="offer-config-setting"><Switch label="Usługi cykliczne" checked={draft.recurringEnabled} onChange={value => setConfig("recurringEnabled", value)} /><div><strong>Usługi cykliczne</strong><span>Zaznacz, jeśli chcesz oferować usługi cykliczne.</span></div>{draft.recurringEnabled && <label className="offer-value-control"><span>−</span><input aria-label="Rabat na usługi cykliczne" type="number" min={0} max={90} value={draft.recurringDiscountPercent} onChange={event => setConfig("recurringDiscountPercent", Number(event.target.value))} /><span>%</span></label>}</div>
      </section>
      <section className="offer-config-card offer-addons-card"><div className="offer-tiers-heading"><h2>Usługi dodatkowe - określ, które czynności wykonujesz i jakie oferujesz ceny</h2><img src={asset("info-addons.svg")} alt="" /></div><div className="offer-config-section-row"><p className="offer-section-help">Usuń usługę, której nie oferujesz - dodaj, jeżeli zmienisz zdanie.</p><button type="button" className="offer-config-button is-primary" disabled={draft.addOns.length >= 20} onClick={() => setAddOnOpen(true)}>Dodaj usługę dodatkową<img src={asset("add-addon.svg")} alt="" /></button></div>
        <div className="offer-addon-grid">{orderedAddOns.map(({ addOn, index }) => <article className="offer-addon" key={addOn.id}>
          <div className="offer-addon-image">{designAddOnImages[addOn.id] ? <img src={asset(designAddOnImages[addOn.id])} alt="" /> : addOnImages[addOn.id] ? <img src={`/figma-assets/services/config/${addOnImages[addOn.id]}`} alt="" /> : <span className="offer-addon-placeholder">+</span>}</div>
          <button type="button" className="offer-addon-remove" aria-label={`Usuń ${addOn.title}`} onClick={() => setConfig("addOns", draft.addOns.filter((_, rowIndex) => rowIndex !== index))}><img src={asset("remove.svg")} alt="" /></button>
          <strong>{addOn.title}</strong><label><input aria-label={`Cena za ${addOn.title}`} inputMode="decimal" value={addOn.price} onChange={event => setConfig("addOns", draft.addOns.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))} /><span>zł / {addOn.billingUnit === "piece" ? "szt." : "30min"}</span></label>
        </article>)}</div>
      </section>
      <section className="offer-config-card offer-presentation-card"><SectionTitle description="Opisz swoją ofertę i dodaj wizualizacje.">Prezentacja</SectionTitle>
        <div className="offer-description-intro"><h3>„Opis” - przedstaw siebie lub swoją firmę</h3><p>Dodaj krótki opis, który pomoże klientom lepiej Cię poznać i zbudować zaufanie. Zachęcamy do użycia formatowania lub emotikon, aby opis był przyjazny i wyróżniał się na tle innych ofert.</p></div>
        <div className="offer-description-editor"><textarea aria-label="Opis ogłoszenia" ref={descriptionRef} maxLength={2000} value={description} onChange={event => { setDescription(event.target.value); setMessage(""); }} placeholder="Opisz Siebie lub Twój zespół, styl pracy, obszar działania oraz to, co wyróżnia Cię na rynku..." /><div className="offer-description-toolbar" aria-label="Formatowanie opisu">{[{ label: "Pogrubienie", icon: "bold.svg", prefix: "**", suffix: "**" }, { label: "Kursywa", icon: "italic.svg", prefix: "_", suffix: "_" }, { label: "Podkreślenie", icon: "underline.svg", prefix: "<u>", suffix: "</u>" }, { label: "Przekreślenie", icon: "strike.svg", prefix: "~~", suffix: "~~" }, { label: "Wyróżnienie", icon: "paint.svg", prefix: "<mark>", suffix: "</mark>" }, { label: "Lista", icon: "list.svg", prefix: "- ", suffix: "" }, { label: "Emotikon", icon: "smile.svg", prefix: "🙂", suffix: "" }].map(item => <button type="button" key={item.label} aria-label={item.label} onClick={() => formatDescription(item.prefix, item.suffix)}><img src={asset(item.icon)} alt="" /></button>)}<small>{description.length}/2000</small></div></div>
        <ProviderOfferMedia value={draft.presentation} onChange={media => setConfig("presentation", media)} disabled={busy} onBusyChange={setMediaBusy} />
      </section>
      <section className="offer-config-card offer-standards"><h2>Standardy</h2><label><input type="checkbox" checked={draft.standardsAccepted} onChange={event => setConfig("standardsAccepted", event.target.checked)} /><span className="offer-standards-check">{draft.standardsAccepted && <img src={asset("check.svg")} alt="" />}</span><span>Zaznacz, aby potwierdzić, że zapoznałeś(-aś) się ze <a href={`${process.env.NEXT_PUBLIC_CUSTOMER_URL ?? "http://localhost:3000"}/standardy-uslug`} target="_blank" rel="noopener noreferrer">Standardem sprzątania mieszkań i domów w Clingo</a> oraz zobowiązujesz się do jego przestrzegania podczas realizacji zleceń.</span></label></section>
      {error && <div className="provider-feedback is-error offer-config-feedback" role="alert">{error}{conflict && <button type="button" className="settings-button" onClick={reload}>Wczytaj aktualne dane</button>}</div>}
      <Toolbar {...toolbarProps} />
    </div>

    {previewOpen && <ProviderModal className="offer-preview-modal" titleId="offer-preview-title" onClose={() => setPreviewOpen(false)}><h2 id="offer-preview-title">Podgląd ogłoszenia</h2>{draft.presentation?.banner && <img className="offer-preview-banner" src={draft.presentation.banner} alt="Baner ogłoszenia" />}<div className="offer-preview-heading"><img src={asset("cleaning.png")} alt="" /><div><strong>{offer.title}</strong><span>{category?.detail}</span></div></div><p><ProviderOfferDescription text={description || "Brak opisu usługi."} /></p><dl><div><dt>Stawka</dt><dd>{previewPrice === null ? "Nieprawidłowa" : `${offerPrice(previewPrice)} / m²`}</dd></div><div><dt>Czas dla 100 m²</dt><dd>{draft.durationPer100SquareMeters} min</dd></div><div><dt>Dodatki</dt><dd>{draft.addOns.length}</dd></div></dl><div className="offer-preview-gallery">{draft.presentation?.gallery.map((src, index) => <img src={src} alt={`Realizacja ${index + 1}`} key={index} />)}</div>{original.publicProfileId && <a href={`${process.env.NEXT_PUBLIC_CUSTOMER_URL ?? "http://localhost:3000"}/profil-ogloszeniowy/${original.publicProfileId}`} target="_blank" rel="noopener noreferrer">Zobacz opublikowane ogłoszenie</a>}</ProviderModal>}
    {addOnOpen && <ProviderModal className="offer-addon-modal" titleId="add-on-title" onClose={() => setAddOnOpen(false)}><h2 id="add-on-title">Dodaj usługę dodatkową</h2><label className="settings-live-field"><span>Wybierz usługę</span><select aria-label="Wybierz usługę dodatkową" value={addOnTemplate} onChange={event => { const id = event.target.value; setAddOnTemplate(id); const template = availableAddOns.find(row => row.id === id); setNewAddOn(template ? { title: template.title, price: minorInput(template.priceMinor), billingUnit: template.billingUnit } : { title: "", price: "", billingUnit: "piece" }); }}><option value="">Własna usługa</option>{availableAddOns.map(row => <option value={row.id} key={row.id}>{row.title}</option>)}</select></label><label className="settings-live-field"><span>Nazwa</span><input maxLength={100} value={newAddOn.title} onChange={(event: ChangeEvent<HTMLInputElement>) => setNewAddOn(previous => ({ ...previous, title: event.target.value }))} /></label><label className="settings-live-field"><span>Cena (zł)</span><input inputMode="decimal" value={newAddOn.price} onChange={(event: ChangeEvent<HTMLInputElement>) => setNewAddOn(previous => ({ ...previous, price: event.target.value }))} /></label><label className="settings-live-field"><span>Sposób rozliczania</span><select value={newAddOn.billingUnit} onChange={event => setNewAddOn(previous => ({ ...previous, billingUnit: event.target.value as "piece" | "halfHour" }))}><option value="piece">za sztukę</option><option value="halfHour">za 30 minut</option></select></label><div className="settings-live-actions"><button type="button" className="settings-button" onClick={() => setAddOnOpen(false)}>Anuluj</button><button type="button" className="employee-save-button" disabled={!newAddOn.title.trim() || priceMinor(newAddOn.price) === null} onClick={createAddOn}>Dodaj</button></div></ProviderModal>}
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
