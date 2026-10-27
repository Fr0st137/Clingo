"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { offerPrice } from "../lib/provider-offers";
import { ApiError, providerApi } from "../lib/provider-client";
import { jobStatuses, timeLabel, type Job } from "../lib/provider-jobs";
import { ProviderModal } from "./provider-modal";
import { ProviderShell } from "./provider-shell";
import { useSettingsResource } from "./provider-settings-state";
import { ProviderProjectEditor } from "./provider-project-editor";
import {projectHref,workLabel,type Project} from "../lib/provider-projects";

type MultiOrderSession = { date: string; startMinute: number; durationMinutes: number; employeeId: string | null };
type MultiOrder = {
  id: string; clientName: string; serviceTitle: string; serviceDetail: string; startDate: string; endDate: string;
  areaSquareMeters: number; addOnCount: number; totalPriceMinor: number; external: boolean;
  status: "pending" | "accepted" | "rejected" | "completed"; sessions: MultiOrderSession[]; notes: string;
  revision: number; acceptedAt: string | null; createdAt: string;
};

const dateLabel = (date: string) => new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const longDate = (date: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const statusLabels = { pending: "Oczekujące", accepted: "Zaakceptowane", rejected: "Odrzucone", completed:"Zakończone" } as const;

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

function MultiOrderDetails({ order, busy, error, onClose, onAction, onEdit }: { order: MultiOrder; busy: boolean; error: string; onClose: () => void; onAction: (action: "accept" | "reject") => void; onEdit: () => void }) {
  return <ProviderModal titleId="multi-order-title" descriptionId="multi-order-description" className="multi-session-modal" onClose={onClose}>
    <div className="multi-session-modal-heading"><div><span className={`multi-session-status is-${order.status}`}>{statusLabels[order.status]}</span><h2 id="multi-order-title">{order.clientName}</h2><p id="multi-order-description">{order.serviceTitle} · {order.serviceDetail}</p></div><strong>{offerPrice(order.totalPriceMinor)}</strong></div>
    <div className="multi-session-modal-facts"><span><small>Termin</small>{dateLabel(order.startDate)} – {dateLabel(order.endDate)}</span><span><small>Powierzchnia</small>{order.areaSquareMeters} m²</span><span><small>Sesje</small>{order.sessions.length}</span><span><small>Usługi dodatkowe</small>{order.addOnCount}</span></div>
    <h3>Harmonogram sesji</h3>
    <ol className="multi-session-schedule">{order.sessions.map((session, index) => <li key={`${session.date}-${session.startMinute}`}><span>{index + 1}</span><div><strong>{longDate(session.date)}</strong><small>{timeLabel(session.startMinute)} – {timeLabel(session.startMinute + session.durationMinutes)} · {session.durationMinutes} min</small></div></li>)}</ol>
    {order.notes && <div className="multi-session-notes"><strong>Uwagi</strong><p>{order.notes}</p></div>}
    {error && <p className="provider-feedback is-error" role="alert">{error}</p>}
    <div className="multi-session-modal-actions">
      <button type="button" className="settings-button" onClick={onClose}>Zamknij</button>
      <button type="button" className="settings-button" disabled={busy} onClick={onEdit}>Edytuj projekt</button>
      {order.status === "pending" ? <><button type="button" className="multi-order-button is-red" disabled={busy} onClick={() => onAction("reject")}>Odrzuć</button><button type="button" className="employee-save-button" disabled={busy} onClick={() => onAction("accept")}>{busy ? "Zapisywanie…" : "Akceptuj zlecenie"}</button></> : order.status === "accepted" ? <Link className="employee-save-button" href="/orders">Przejdź do sesji</Link> : null}
    </div>
  </ProviderModal>;
}

function MultiSessionContent() {
  const resource = useSettingsResource<MultiOrder[]>("multi-orders");
  const bookings = useSettingsResource<Job[]>("jobs");
  const projects = useSettingsResource<Project[]>("projects");
  const [projectKey,setProjectKey]=useState<{source:Project["source"];id:string}|null>(null);
  useEffect(()=>{const params=new URLSearchParams(window.location.search),source=params.get("source"),id=params.get("project");if(id&&(source==="booking"||source==="manual"))setProjectKey({source,id});},[]);
  const [sort, setSort] = useState("start-asc");
  const [filter, setFilter] = useState<"all" | MultiOrder["status"]>("all");
  const publicBookings = (projects.data??[]).filter(project=>project.source==="booking"&&(filter==="all"||filter==="accepted"&&project.status==="scheduled"||filter==="completed"&&project.status==="completed"));
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
      <div className="multi-session-filter" role="group" aria-label="Status zlecenia">{(["all", "pending", "accepted", "rejected", "completed"] as const).map(value => <button type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)} aria-pressed={filter === value} key={value}>{value === "all" ? "Wszystkie" : statusLabels[value]}</button>)}</div>
      <section aria-label="Rezerwacje wielosesyjne ze strony Clingo"><h2>Rezerwacje ze strony Clingo</h2>{projects.loading ? <p role="status">Wczytywanie rezerwacji…</p> : projects.error ? <p role="alert">{projects.error}<button type="button" onClick={projects.reload}>Spróbuj ponownie</button></p> : !publicBookings.length ? <p>Brak rezerwacji wielosesyjnych ze strony Clingo.</p> : publicBookings.map(project => <p key={project.id}><Link href={projectHref(project.source,project.id)} onClick={event=>{if(event.ctrlKey||event.metaKey)return;event.preventDefault();setProjectKey({source:project.source,id:project.id});window.history.replaceState(null,"",projectHref(project.source,project.id));}}>{project.clientName} · {project.title} · {project.sessions.length} sesji · {offerPrice(project.priceMinor)} · {jobStatuses[project.status as Job["status"]]??project.status}</Link><span className="team-help"> · Zaplanowano {workLabel(project.balance.plannedMinutes)} / {workLabel(project.balance.requiredMinutes)} wymaganych ({project.balance.percentage}%)</span></p>)}</section>
      {message && <p className="provider-feedback" role="status">{message}</p>}
      {resource.loading && <div className="provider-state" role="status">Wczytywanie zleceń wielosesyjnych…</div>}
      {resource.error && <div className="provider-state" role="alert"><p>{resource.error}</p><button type="button" className="settings-button" onClick={resource.reload}>Spróbuj ponownie</button></div>}
      {!resource.loading && !resource.error && <div className="multi-session-card-list">{orders.map(order => <MultiOrderCard key={order.id} order={order} onOpen={() => { setSelectedId(order.id); setError(""); }} />)}{orders.length === 0 && <div className="provider-state">Brak zleceń o wybranym statusie.</div>}</div>}
    </div>
    <span className="multi-session-orders-spacer" aria-hidden="true" />
    {selected && <MultiOrderDetails order={selected} busy={busy} error={error} onClose={() => setSelectedId(null)} onAction={act} onEdit={()=>{setProjectKey({source:"manual",id:selected.id});window.history.replaceState(null,"",projectHref("manual",selected.id));setSelectedId(null);}} />}
    {projectKey&&<ProviderProjectEditor source={projectKey.source} id={projectKey.id} onClose={()=>{setProjectKey(null);window.history.replaceState(null,"","/orders/multi-session");}} onSaved={()=>{projects.reload();resource.reload();bookings.reload();}}/>}
  </section>;
}

export function ProviderMultiSessionOrdersPage() { return <ProviderShell active="Zlecenia" live figmaNode="3931:5014"><MultiSessionContent /></ProviderShell>; }
