"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { offerPrice } from "../lib/provider-offers";
import { ApiError, providerApi } from "../lib/provider-client";
import { timeLabel } from "../lib/provider-jobs";
import { ProviderModal } from "./provider-modal";
import { ProviderShell } from "./provider-shell";
import { useSettingsResource } from "./provider-settings-state";

type MultiOrderSession = { date: string; startMinute: number; durationMinutes: number; employeeId: string | null };
type MultiOrder = {
  id: string; clientName: string; serviceTitle: string; serviceDetail: string; startDate: string; endDate: string;
  areaSquareMeters: number; addOnCount: number; totalPriceMinor: number; external: boolean;
  status: "pending" | "accepted" | "rejected"; sessions: MultiOrderSession[]; notes: string;
  revision: number; acceptedAt: string | null; createdAt: string;
};

const dateLabel = (date: string) => new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const longDate = (date: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const statusLabels = { pending: "Oczekujące", accepted: "Zaakceptowane", rejected: "Odrzucone" } as const;

function MultiOrderCard({ order, onOpen }: { order: MultiOrder; onOpen: () => void }) {
  return <button type="button" className={`order-card is-multi-session is-${order.status}`} onClick={onOpen}>
    <span className="multi-session-order-dates">
      <span><span>Data rozpoczęcia:</span><time dateTime={order.startDate}>{dateLabel(order.startDate)}</time></span>
      <img src="/figma-assets/orders/multi-session/icon-04.svg" alt="" />
      <span><span>Data zakończenia:</span><time dateTime={order.endDate}>{dateLabel(order.endDate)}</time></span>
    </span>
    <span className="order-card-color" aria-hidden="true" />
    <span className="order-card-details">
      <span className="multi-session-order-client">
        <strong>{order.clientName}</strong>
        <span className="order-card-tags"><span><img src="/figma-assets/orders/multi-session/icon-06.svg" alt="" />{order.areaSquareMeters} m²</span>{order.addOnCount > 0 && <span>+{order.addOnCount} usług dodatkowych</span>}{order.external && <span className="order-card-external">Zewnętrzne</span>}</span>
        <strong className="multi-session-order-price">{offerPrice(order.totalPriceMinor)}</strong>
      </span>
      <span className="order-card-service"><span>{order.serviceTitle} <span>· {order.serviceDetail}</span></span><span className={`multi-session-status is-${order.status}`}>{statusLabels[order.status]}</span></span>
    </span>
    <span className="multi-session-order-count"><img src="/figma-assets/orders/multi-session/icon-03.svg" alt="" />Sesje {order.sessions.length}</span>
  </button>;
}

function MultiOrderDetails({ order, busy, error, onClose, onAction }: { order: MultiOrder; busy: boolean; error: string; onClose: () => void; onAction: (action: "accept" | "reject") => void }) {
  return <ProviderModal titleId="multi-order-title" descriptionId="multi-order-description" className="multi-session-modal" onClose={onClose}>
    <div className="multi-session-modal-heading"><div><span className={`multi-session-status is-${order.status}`}>{statusLabels[order.status]}</span><h2 id="multi-order-title">{order.clientName}</h2><p id="multi-order-description">{order.serviceTitle} · {order.serviceDetail}</p></div><strong>{offerPrice(order.totalPriceMinor)}</strong></div>
    <div className="multi-session-modal-facts"><span><small>Termin</small>{dateLabel(order.startDate)} – {dateLabel(order.endDate)}</span><span><small>Powierzchnia</small>{order.areaSquareMeters} m²</span><span><small>Sesje</small>{order.sessions.length}</span><span><small>Usługi dodatkowe</small>{order.addOnCount}</span></div>
    <h3>Harmonogram sesji</h3>
    <ol className="multi-session-schedule">{order.sessions.map((session, index) => <li key={`${session.date}-${session.startMinute}`}><span>{index + 1}</span><div><strong>{longDate(session.date)}</strong><small>{timeLabel(session.startMinute)} – {timeLabel(session.startMinute + session.durationMinutes)} · {session.durationMinutes} min</small></div></li>)}</ol>
    {order.notes && <div className="multi-session-notes"><strong>Uwagi</strong><p>{order.notes}</p></div>}
    {error && <p className="provider-feedback is-error" role="alert">{error}</p>}
    <div className="multi-session-modal-actions">
      <button type="button" className="settings-button" onClick={onClose}>Zamknij</button>
      {order.status === "pending" ? <><button type="button" className="multi-order-button is-red" disabled={busy} onClick={() => onAction("reject")}>Odrzuć</button><button type="button" className="employee-save-button" disabled={busy} onClick={() => onAction("accept")}>{busy ? "Zapisywanie…" : "Akceptuj zlecenie"}</button></> : order.status === "accepted" ? <Link className="employee-save-button" href="/orders">Przejdź do sesji</Link> : null}
    </div>
  </ProviderModal>;
}

function MultiSessionContent() {
  const resource = useSettingsResource<MultiOrder[]>("multi-orders");
  const [sort, setSort] = useState("start-asc");
  const [filter, setFilter] = useState<"all" | MultiOrder["status"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const orders = useMemo(() => [...(resource.data ?? [])].filter(order => filter === "all" || order.status === filter).sort((a, b) => sort === "start-desc" ? b.startDate.localeCompare(a.startDate) : sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.startDate.localeCompare(b.startDate)), [resource.data, filter, sort]);
  const selected = (resource.data ?? []).find(order => order.id === selectedId) ?? null;
  const act = async (action: "accept" | "reject") => {
    if (!selected || busy) return;
    setBusy(true); setError("");
    try {
      const saved = await providerApi<MultiOrder>(`multi-orders/${selected.id}/action`, "PUT", { action, revision: selected.revision });
      resource.setData(current => (current ?? []).map(order => order.id === saved.id ? saved : order));
      setMessage(action === "accept" ? `Zaakceptowano zlecenie. ${saved.sessions.length} sesji pojawiło się na liście zamówień.` : "Zlecenie zostało odrzucone.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nie udało się zapisać decyzji.");
      if (caught instanceof ApiError && caught.status === 409) resource.reload();
    } finally { setBusy(false); }
  };

  return <section className="multi-session-orders-content" aria-label="Zlecenia wielosesyjne" data-figma-node="3931:5014">
    <Link href="/orders" className="provider-back-link"><img src="/figma-assets/orders/multi-session/icon-01.svg" alt="" />Wróć</Link>
    <div className="multi-session-orders-list">
      <div className="multi-session-orders-heading"><div><h1>Zlecenia wielosesyjne</h1><p>Zlecenia wielosesyjne widnieją także na liście zamówień jako poszczególne sesje.</p></div><label className="multi-session-orders-sort"><span>Sortuj:</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="start-asc">Data początkowa, rosnąco</option><option value="start-desc">Data początkowa, malejąco</option><option value="newest">Najnowsze zgłoszenia</option></select><img src="/figma-assets/orders/multi-session/icon-02.svg" alt="" /></label></div>
      <div className="multi-session-filter" role="group" aria-label="Status zlecenia">{(["all", "pending", "accepted", "rejected"] as const).map(value => <button type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)} aria-pressed={filter === value} key={value}>{value === "all" ? "Wszystkie" : statusLabels[value]}</button>)}</div>
      {message && <p className="provider-feedback" role="status">{message}</p>}
      {resource.loading && <div className="provider-state" role="status">Wczytywanie zleceń wielosesyjnych…</div>}
      {resource.error && <div className="provider-state" role="alert"><p>{resource.error}</p><button type="button" className="settings-button" onClick={resource.reload}>Spróbuj ponownie</button></div>}
      {!resource.loading && !resource.error && <div className="multi-session-card-list">{orders.map(order => <MultiOrderCard key={order.id} order={order} onOpen={() => { setSelectedId(order.id); setError(""); }} />)}{orders.length === 0 && <div className="provider-state">Brak zleceń o wybranym statusie.</div>}</div>}
    </div>
    <span className="multi-session-orders-spacer" aria-hidden="true" />
    {selected && <MultiOrderDetails order={selected} busy={busy} error={error} onClose={() => setSelectedId(null)} onAction={act} />}
  </section>;
}

export function ProviderMultiSessionOrdersPage() { return <ProviderShell active="Zlecenia" live figmaNode="3931:5014"><MultiSessionContent /></ProviderShell>; }
