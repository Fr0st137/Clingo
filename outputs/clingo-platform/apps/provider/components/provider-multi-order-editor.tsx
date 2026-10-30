"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Offer } from "../lib/provider-offers";
import type { AdditionalPosition } from "../lib/provider-single-order";
import { ProviderModal } from "./provider-modal";
import { SingleOrderExtras } from "./provider-single-order-steps";
import { ProviderOrderExtrasPicker } from "./provider-order-extras-picker";
import { useSettingsResource, useUnsavedSettings } from "./provider-settings-state";
import { useProvider } from "./provider-session";
import { storeManualProject, type MultiOrderDetailsDraft } from "../lib/provider-manual-project";
import { manualProjectPricing } from "../../api/src/provider/manual-project-pricing";
import { warsawToday } from "../lib/provider-schedule";

type Client = { id: string; name: string; street: string; postalCode: string; city: string };
const asset = (name: string) => `/figma-assets/orders/multi-create/${name}`;

export function ProviderMultiOrderEditor({ clientId = "", date = warsawToday(), initialDraft, onClose, onContinue }: {
  clientId?: string; date?: string; initialDraft?: MultiOrderDetailsDraft; onClose: () => void; onContinue?: (draft: MultiOrderDetailsDraft) => void;
}) {
  const router = useRouter(), context = useProvider();
  const clients = useSettingsResource<Client[]>("clients");
  const offers = useSettingsResource<Offer[]>("services");
  const [draft, setDraft] = useState({ clientId: initialDraft?.clientId ?? clientId, offerId: initialDraft?.offerId ?? "", area: initialDraft?.area ?? "100", address: initialDraft?.address ?? "" });
  const [addressEdited, setAddressEdited] = useState(!!initialDraft);
  const [quantities, setQuantities] = useState<Record<string, number>>(initialDraft?.quantities ?? {});
  const [positions, setPositions] = useState<AdditionalPosition[]>(initialDraft?.positions ?? [{ id: "initial", title: "", quantity: "", price: "" }]);
  const [tab, setTab] = useState<"details" | "extras">("details");
  const [confirmClose, setConfirmClose] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  useUnsavedSettings(dirty);

  const client = clients.data?.find(row => row.id === draft.clientId);
  const offer = offers.data?.find(row => row.id === draft.offerId && row.status !== "archived");
  const availableOffers = (offers.data ?? []).filter(row => row.status !== "archived");
  const address = addressEdited ? draft.address : [client?.street, [client?.postalCode, client?.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const extras = offer?.configuration?.addOns ?? [];
  const extraCount = extras.reduce((count, row) => count + (quantities[row.id] ?? 0), 0) + positions.filter(row => row.title.trim()).length;
  const loading = clients.loading || offers.loading;
  const loadError = clients.error || offers.error;
  function change<K extends keyof typeof draft>(key: K, value: typeof draft[K]) {
    setDraft(previous => ({ ...previous, [key]: value })); setDirty(true); setError("");
  }
  function close() { if (dirty) setConfirmClose(true); else onClose(); }
  function selectTab(value: "details" | "extras") { setTab(value); setError(""); }
  function next() {
    if (!client || !offer) { setTab("details"); setError("Wybierz klienta i usługę."); return; }
    const area = Number(draft.area.replace(",", "."));
    if (!Number.isFinite(area) || area <= 0 || area > 10000 || Math.abs(Math.round(area * 100) - area * 100) > 1e-7) {
      setTab("details"); setError("Podaj powierzchnię od 0,01 do 10 000 m², z maksymalnie dwoma miejscami po przecinku."); return;
    }
    if (!address.trim() || address.trim().length > 420) { setTab("details"); setError("Podaj dokładny adres lokalizacji objętej usługą."); return; }
    const details = { ...draft, address: address.trim(), quantities, positions };
    try {
      manualProjectPricing(offer.configuration, { areaSquareMeters: area, quantities, positions, discount: { mode: "percent", value: "0" } });
      if (onContinue) { onContinue(details); return; }
      if (!context?.account) return;
      storeManualProject(context.account.id, { ...details, requestId: crypto.randomUUID(), offerRevision: offer.revision, date, sessions: [], discount: { mode: "percent", value: "0" }, notes: "", history: [] });
      setDirty(false); router.push("/orders/multi-session/new");
    } catch (failure) { setError((failure as Error).message); }
  }
  if (pickerOpen) return <ProviderOrderExtrasPicker extras={extras} quantities={quantities} onClose={() => setPickerOpen(false)} onSave={value => { setQuantities(value); setDirty(true); setError(""); setPickerOpen(false); }} />;
  return <ProviderModal className={`single-order-modal multi-order-create${confirmClose ? " is-confirming" : tab === "extras" ? " is-extras" : ""}`} titleId="multi-order-create-title" descriptionId="multi-order-create-description" onClose={close}>
    <div className="single-order-heading"><h2 id="multi-order-create-title">{confirmClose ? "Odrzucić zmiany?" : "Dodaj zamówienie wielosesyjne"}</h2><p id="multi-order-create-description">{confirmClose ? "Niezapisane zmiany zostaną utracone." : "Wypełnij pola, aby dodać zamówienie spoza Clingo."}</p></div>
    {confirmClose ? <div className="single-order-actions"><button type="button" onClick={() => setConfirmClose(false)}>Wróć do formularza</button><button type="button" className="is-primary" onClick={onClose}>Odrzuć zmiany</button></div> : <>
      <div className="single-order-tabs" role="tablist" aria-label="Dane zamówienia wielosesyjnego" onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextTab = event.key === "Home" ? "details" : event.key === "End" ? "extras" : tab === "details" ? "extras" : "details";
        selectTab(nextTab);
        event.currentTarget.querySelector<HTMLButtonElement>(`#multi-${nextTab}-tab`)?.focus();
      }}>
        <button id="multi-details-tab" type="button" role="tab" tabIndex={tab === "details" ? 0 : -1} aria-selected={tab === "details"} aria-controls="multi-details" onClick={() => selectTab("details")}>Szczegóły</button>
        <button id="multi-extras-tab" type="button" role="tab" tabIndex={tab === "extras" ? 0 : -1} aria-selected={tab === "extras"} aria-controls="multi-extras" onClick={() => selectTab("extras")}>Usługi dodatkowe<span aria-live="polite">{extraCount}</span></button>
      </div>
      {loading || loadError ? <div className="provider-state" role={loadError ? "alert" : "status"}>{loading ? "Wczytywanie klientów i usług…" : <><p>{loadError}</p><button type="button" className="settings-button" onClick={() => { clients.reload(); offers.reload(); }}>Spróbuj ponownie</button></>}</div> : tab === "details" ? <div className="single-order-details" role="tabpanel" id="multi-details" aria-labelledby="multi-details-tab">
        <div className="single-order-row">
          <label className="single-order-client single-order-control"><span className="single-order-client-icon"><img src={asset("client.svg")} alt="" /></span><span className="single-order-select-text">{client?.name || "Wybierz Klienta"}</span><img src={asset("next.svg")} alt="" /><select aria-label="Klient" value={draft.clientId} onChange={event => { change("clientId", event.target.value); setAddressEdited(false); }}><option value="">Wybierz Klienta</option>{clients.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
          <label className={`single-order-control single-order-area${draft.area.length > 3 ? " has-long-area" : ""}`}><span className="multi-order-area-value"><input aria-label="Powierzchnia w m²" type="number" min="0.01" max="10000" step="0.01" style={{ width: `${Math.max(3, draft.area.length)}ch` }} value={draft.area} onChange={event => change("area", event.target.value)} /><span>m²</span></span><img src={asset("area.svg")} alt="" /></label>
        </div>
        {!clients.data?.length && <p className="multi-order-empty-help">Nie masz jeszcze klientów. <Link href="/clients">Dodaj klienta</Link></p>}
        <label className="single-order-control single-order-service"><span className="single-order-select-text">{offer?.title || "Wybierz usługę"}</span><img src={asset("next.svg")} alt="" /><select aria-label="Usługa" value={draft.offerId} onChange={event => { change("offerId", event.target.value); setQuantities({}); }}><option value="">Wybierz usługę</option>{availableOffers.map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label>
        {!availableOffers.length && <p className="multi-order-empty-help">Nie masz jeszcze usług. <Link href="/services">Dodaj usługę</Link></p>}
        <label className="single-order-control single-order-address"><img src={asset("location.png")} width="17" height="17" alt="" /><input aria-label="Dokładny adres lokalizacji objętej usługą" placeholder="Dokładny adres lokalizacji objętej usługą" maxLength={420} value={address} onChange={event => { setAddressEdited(true); change("address", event.target.value); }} /></label>
      </div> : <SingleOrderExtras idPrefix="multi" onOpenPicker={() => setPickerOpen(true)} extras={extras} quantities={quantities} onQuantity={(id, count) => { setQuantities(previous => ({ ...previous, [id]: count })); setDirty(true); setError(""); }} positions={positions} onPositions={rows => { setPositions(rows); setDirty(true); setError(""); }} />}
      {error && <p className="single-order-error" role="alert">{error}</p>}
      <div className="single-order-actions"><button type="button" onClick={close}>Anuluj</button><button type="button" className="is-primary" disabled={loading || !!loadError} onClick={next}>Dalej</button></div>
    </>}
  </ProviderModal>;
}
