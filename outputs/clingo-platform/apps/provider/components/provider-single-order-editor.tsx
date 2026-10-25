"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ProviderModal } from "./provider-modal";
import { useSettingsResource, useUnsavedSettings } from "./provider-settings-state";
import { providerApi, type Employee } from "../lib/provider-client";
import { minorInput, offerPrice, priceMinor, type Offer } from "../lib/provider-offers";
import { timeLabel, type Job } from "../lib/provider-jobs";
import { orderQuote, type AdditionalPosition } from "../lib/provider-single-order";
import { SingleOrderExtras, SingleOrderSummary, type DiscountDraft, type InvoiceDraft } from "./provider-single-order-steps";

type Client = { id: string; name: string; street: string; postalCode: string; city: string };
const asset = (name: string) => `/figma-assets/orders/single/${name}`;
const minute = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) : NaN;
const durationLabel = (value: number) => `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}min` : ""}`;

export function ProviderSingleOrderEditor({ date, clientId = "", onClose, onSaved }: { date: string; clientId?: string; onClose: () => void; onSaved: (job: Job) => void }) {
  const clients = useSettingsResource<Client[]>("clients");
  const offers = useSettingsResource<Offer[]>("services");
  const employees = useSettingsResource<Employee[]>("employees");
  const [draft, setDraft] = useState({ clientId, offerId: "", employeeId: "", area: "100", date, start: "09:00", end: "10:00", address: "", price: "", notes: "" });
  const [addressEdited, setAddressEdited] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<"details" | "extras">("details");
  const [review, setReview] = useState(false);
  const [positions, setPositions] = useState<AdditionalPosition[]>([{ id: "initial", title: "", quantity: "", price: "" }]);
  const [discount, setDiscount] = useState<DiscountDraft>({ mode: "percent", value: "0" });
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceDraft>({ company: "", taxId: "", address: "" });
  const [employeePicker, setEmployeePicker] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useUnsavedSettings(dirty);
  const client = clients.data?.find(row => row.id === draft.clientId);
  const offer = offers.data?.find(row => row.id === draft.offerId);
  const employee = employees.data?.find(row => row.id === draft.employeeId);
  const address = addressEdited ? draft.address : [client?.street, [client?.postalCode, client?.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const duration = minute(draft.end) - minute(draft.start);
  const extras = offer?.configuration?.addOns ?? [];
  const selectedExtras = extras.filter(row => quantities[row.id] > 0);
  const extrasTotal = selectedExtras.reduce((total, row) => total + row.priceMinor * quantities[row.id], 0);
  const extraCount = selectedExtras.reduce((count, row) => count + quantities[row.id], 0) + positions.filter(row => row.title.trim()).length;
  const extraLines = selectedExtras.map(row => ({ label: `${row.title} × ${quantities[row.id]}`, amount: row.priceMinor * quantities[row.id] }));
  let quote = { positions: [] as Array<{ label: string; amount: number }>, subtotal: (priceMinor(draft.price) ?? 0) + extrasTotal, discountMinor: 0, total: (priceMinor(draft.price) ?? 0) + extrasTotal, discountPercent: 0 };
  let quoteError = "";
  try { quote = orderQuote(priceMinor(draft.price) ?? 0, extraLines, positions, { mode: "percent", value: "0" }); quote = orderQuote(priceMinor(draft.price) ?? 0, extraLines, positions, discount); }
  catch (failure) { quoteError = (failure as Error).message; }
  const suggested = offer?.configuration?.areaTiers?.find(tier => Number(draft.area) >= tier.minSquareMeters && (tier.maxSquareMeters === null || Number(draft.area) <= tier.maxSquareMeters))?.workers;
  const loading = clients.loading || offers.loading || employees.loading;
  const loadError = clients.error || offers.error || employees.error;
  function change<K extends keyof typeof draft>(key: K, value: typeof draft[K]) { setDraft(previous => ({ ...previous, [key]: value })); setDirty(true); setError(""); }
  function close() { if (!pending.current) { if (dirty) setConfirmClose(true); else onClose(); } }
  function selectOffer(id: string) {
    const next = offers.data?.find(row => row.id === id);
    const minutes = next?.durationMinutes ?? 60;
    setDraft(previous => ({ ...previous, offerId: id, price: next ? minorInput(next.priceMinor) : "", end: minute(previous.start) + minutes < 1440 ? timeLabel(minute(previous.start) + minutes) : previous.end }));
    setQuantities({}); setDirty(true); setError("");
  }
  function validate() {
    if (!draft.clientId || !offer || offer.status === "archived") return "Wybierz klienta i usługę.";
    if (!/^\d{1,6}$/.test(draft.area) || Number(draft.area) < 1 || Number(draft.area) > 100000) return "Podaj powierzchnię od 1 do 100 000 m².";
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(draft.date) || !Number.isFinite(Date.parse(draft.date + "T12:00:00Z")) || new Date(draft.date + "T12:00:00Z").toISOString().slice(0, 10) !== draft.date) return "Wybierz poprawną datę w latach 2000–2099.";
    if (!Number.isFinite(duration) || duration < 15) return "Wybierz godziny w tym samym dniu, z czasem trwania co najmniej 15 minut.";
    if (!address.trim() || address.trim().length > 420) return "Podaj dokładny adres (maksymalnie 420 znaków).";
    if (priceMinor(draft.price) === null || (priceMinor(draft.price) ?? 0) + extrasTotal > 10000000) return "Podaj poprawną kwotę; suma nie może przekroczyć 100 000 zł.";
    return "";
  }
  function next() {
    const message = validate(); setError(message);
    if (message) { setTab("details"); return; }
    setEmployeePicker(false);
    if (tab === "details") { setTab("extras"); return; }
    if (quoteError) { setError(quoteError); return; }
    setReview(true);
  }
  async function save() {
    if (pending.current) return;
    const message = validate(); if (message) { setError(message); setReview(false); return; }
    if (quoteError) { setError(quoteError); return; }
    if (invoiceEnabled && (!invoice.company.trim() || !invoice.taxId.trim() || !invoice.address.trim())) { setError("Uzupełnij nazwę firmy, NIP i adres do faktury."); return; }
    const notes = [`Powierzchnia: ${draft.area} m².`, ...selectedExtras.map(row => `${row.title}: ${quantities[row.id]} ${row.billingUnit === "halfHour" ? "× 30 min" : "szt."} (${offerPrice(row.priceMinor * quantities[row.id])}).`), ...quote.positions.map(row => `${row.label}: ${offerPrice(row.amount)}.`), quote.discountMinor ? `Rabat: ${offerPrice(quote.discountMinor)}. Kwota przed rabatem: ${offerPrice(quote.subtotal)}.` : "", invoiceEnabled ? `Dane do faktury: ${invoice.company.trim()}, NIP: ${invoice.taxId.trim()}, ${invoice.address.trim()}.` : "", draft.notes.trim()].filter(Boolean).join("\n");
    if (notes.length > 2000) { setError("Skróć notatkę; razem ze szczegółami zamówienia może zawierać 2000 znaków."); return; }
    pending.current = true; setBusy(true); setError("");
    try { const job = await providerApi<Job>("jobs", "POST", { clientId: draft.clientId, offerId: draft.offerId, employeeId: draft.employeeId || null, date: draft.date, startMinute: minute(draft.start), durationMinutes: duration, priceMinor: quote.total, address: address.trim(), status: "scheduled", notes }); setDirty(false); onSaved(job); }
    catch (failure) { setError((failure as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <ProviderModal className={`single-order-modal${!confirmClose && review ? " is-summary" : !confirmClose && tab === "extras" ? " is-continuation" : ""}`} titleId="single-order-title" descriptionId="single-order-description" onClose={close}>
    <div className="single-order-heading"><h2 id="single-order-title">{confirmClose ? "Odrzucić zmiany?" : review ? "Dodaj zamówienie - podsumowanie" : "Dodaj zamówienie jednosesyjne"}</h2><p id="single-order-description">{confirmClose ? "Niezapisane zmiany zostaną utracone." : review ? "Sprawdź, czy wszystko się zgadza i dodaj zamówienie do kalendarza" : "Wypełnij pola, aby dodać zamówienie spoza Clingo."}</p></div>
    {confirmClose ? <div className="single-order-actions"><button type="button" onClick={() => setConfirmClose(false)}>Wróć</button><button type="button" className="is-primary" onClick={onClose}>Odrzuć zmiany</button></div> : loading || loadError ? <div className="provider-state" role={loadError ? "alert" : "status"}>{loading ? "Wczytywanie klientów, usług i pracowników…" : <><p>{loadError}</p><button type="button" onClick={() => { clients.reload(); offers.reload(); employees.reload(); }}>Spróbuj ponownie</button></>}</div> : !clients.data?.length || !offers.data?.some(row => row.status !== "archived") ? <div className="provider-state"><p>Dodaj klienta i usługę, aby utworzyć zamówienie.</p><Link href="/clients">Dodaj klienta</Link><br /><Link href="/services">Dodaj usługę</Link></div> : <>
      {review ? <SingleOrderSummary lines={[{ label: "Dojazd", amount: 0 }, { label: `Powierzchnia (${draft.area}m²)`, amount: priceMinor(draft.price) ?? 0 }, ...extraLines, ...quote.positions]} total={quote.total} discount={discount} discountMinor={quote.discountMinor} discountPercent={quote.discountPercent} onDiscount={value => { setDiscount(value); setDirty(true); setError(""); }} invoice={invoice} invoiceEnabled={invoiceEnabled} onInvoiceEnabled={value => { setInvoiceEnabled(value); setDirty(true); setError(""); }} onInvoice={value => { setInvoice(value); setDirty(true); setError(""); }} busy={busy} /> : <>
        <div className="single-order-tabs" role="tablist" aria-label="Dane zamówienia"><button id="single-details-tab" type="button" role="tab" aria-selected={tab === "details"} aria-controls="single-details" onClick={() => setTab("details")}>Szczegóły</button><button id="single-extras-tab" type="button" role="tab" aria-selected={tab === "extras"} aria-controls="single-extras" onClick={() => setTab("extras")}>Usługi dodatkowe<span>{extraCount}</span></button></div>
        {tab === "details" ? <div className="single-order-details" role="tabpanel" id="single-details" aria-labelledby="single-details-tab">
          <div className="single-order-row"><label className="single-order-client single-order-control"><span className="single-order-client-icon"><img src={asset("client.svg")} alt="" /></span><span className="single-order-select-text">{client?.name || "Wybierz Klienta"}</span><img src={asset("next.svg")} alt="" /><select aria-label="Klient" value={draft.clientId} onChange={event => { change("clientId", event.target.value); setAddressEdited(false); }}><option value="">Wybierz Klienta</option>{clients.data.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label className="single-order-control single-order-area"><input aria-label="Powierzchnia w m²" type="number" min={1} max={100000} value={draft.area} onChange={event => change("area", event.target.value)} /><span>m²</span><img src={asset("area.svg")} alt="" /></label></div>
          <div className="single-order-row"><label className="single-order-control single-order-service"><span className="single-order-select-text">{offer?.title || "Wybierz usługę"}</span><img src={asset("next.svg")} alt="" /><select aria-label="Usługa" value={draft.offerId} onChange={event => selectOffer(event.target.value)}><option value="">Wybierz usługę</option>{offers.data?.filter(row => row.status !== "archived").map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label><div className="single-order-control single-order-frequency">Jednorazowa<img src={asset("frequency.svg")} alt="" /></div></div>
          <div className="single-order-datetime"><label className="single-order-control single-order-date"><span>{new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date((/^20\d{2}-\d{2}-\d{2}$/.test(draft.date) && Number.isFinite(Date.parse(draft.date)) ? draft.date : date) + "T12:00:00Z"))}</span><img src={asset("calendar.svg")} alt="" /><input aria-label="Data zamówienia" type="date" min="2000-01-01" max="2099-12-31" value={draft.date} onChange={event => change("date", event.target.value)} /></label><div className="single-order-time-range"><label className="single-order-control single-order-time"><input aria-label="Godzina rozpoczęcia" type="time" value={draft.start} onChange={event => change("start", event.target.value)} /><img src={asset("clock.svg")} alt="" /></label><div className="single-order-duration"><span>{Number.isFinite(duration) && duration >= 0 ? durationLabel(duration) : "—"}</span><img src={asset("arrow.svg")} alt="" /></div><label className="single-order-control single-order-time"><input aria-label="Godzina zakończenia" type="time" value={draft.end} onChange={event => change("end", event.target.value)} /><img src={asset("clock.svg")} alt="" /></label></div></div>
          <label className="single-order-control single-order-address"><img src={asset("location.png")} width="17" height="17" alt="" /><input aria-label="Dokładny adres lokalizacji objętej usługą" placeholder="Dokładny adres lokalizacji objętej usługą" maxLength={420} value={address} onChange={event => { setAddressEdited(true); change("address", event.target.value); }} /></label>
          <div className="single-order-staff"><div className="single-order-staff-heading"><button type="button" className="single-order-add-employee" aria-expanded={employeePicker} onClick={() => setEmployeePicker(value => !value)}>Dodaj pracownika<img src={asset("plus.svg")} alt="" /></button><span>Sugerowani pracownicy: {suggested ?? "—"}</span></div>{employeePicker && <div className="single-order-employee-picker"><label>Pracownik<select aria-label="Przypisany pracownik" value={draft.employeeId} onChange={event => { change("employeeId", event.target.value); setEmployeePicker(false); }}><option value="">Bez przypisania</option>{employees.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>{!employees.data?.length && <Link href="/employees/add">Dodaj pracownika do firmy</Link>}</div>}{employee ? <div className="single-order-assigned"><span>{employee.name}</span><button type="button" onClick={() => change("employeeId", "")}>Usuń przypisanie</button></div> : <div className="single-order-empty"><img src={asset("empty-employees.png")} width="100" height="85" alt="" /><span>Przypisz pracowników</span></div>}</div>
        </div> : <SingleOrderExtras extras={extras} quantities={quantities} onQuantity={(id, count) => { setQuantities(previous => ({ ...previous, [id]: count })); setDirty(true); setError(""); }} positions={positions} onPositions={rows => { setPositions(rows); setDirty(true); setError(""); }} />}
      </>}
      {(error || review && quoteError) && <p className="single-order-error" role="alert">{error || quoteError}</p>}
      <div className="single-order-actions"><button type="button" disabled={busy} onClick={review ? () => { setReview(false); setTab("extras"); setError(""); } : close}>{review ? "Cofnij" : "Anuluj"}</button><button type="button" className="is-primary" disabled={busy} onClick={review ? save : next}>{busy ? "Zapisywanie…" : review ? "Dodaj zamówienie" : "Dalej"}</button></div>
    </>}
  </ProviderModal>;
}
