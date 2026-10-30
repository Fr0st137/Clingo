"use client";

import "../app/order-history.css";
import type { OrderHistoryEntry } from "../../api/src/provider/order-history";
import type { Project } from "../lib/provider-projects";
import { ProviderModal } from "./provider-modal";
import { useSettingsResource } from "./provider-settings-state";

export function projectHistoryEntries(events: Project["history"]): OrderHistoryEntry[] {
  return events.map(event => {
    if (event.changes) return { at: event.at, changes: event.changes };
    const summary = [`dodano sesje: ${event.added.length}`, `usunięto: ${event.removed.length}`, `zmieniono: ${event.changed.length}`, ...(event.areaChanged ? ["zmieniono powierzchnię"] : [])].join(", ");
    return { at: event.at, changes: [{ type: "Zmiana harmonogramu", before: "Brak zapisanych wcześniejszych wartości", after: summary }] };
  });
}
export function ProviderOrderHistoryDialog({ entries, onClose, loading = false, error = "", reload }: {
  entries: OrderHistoryEntry[]; onClose: () => void; loading?: boolean; error?: string; reload?: () => void;
}) {
  const rows = entries.flatMap((entry, eventIndex) => entry.changes.map((change, index) => ({ ...change, at: entry.at, key: `${eventIndex}-${index}`, eventIndex }))).sort((a, b) => b.at.localeCompare(a.at) || b.eventIndex - a.eventIndex);
  const date = (at: string, kind: "date" | "time") => {
    const value = new Date(at);
    if (!Number.isFinite(+value)) return "—";
    const formatted = new Intl.DateTimeFormat("pl-PL", kind === "date" ? { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Warsaw" } : { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(value);
    return kind === "time" ? formatted.replace(/^0(?=\d:)/, "") : formatted;
  };
  return <ProviderModal className="order-history-dialog" titleId="order-history-title" onClose={onClose}>
    <h2 id="order-history-title">Historia zmian zamówienia</h2>
    {loading ? <p role="status">Wczytywanie historii…</p> : error ? <div role="alert">{error}{reload && <button type="button" className="settings-button" onClick={reload}>Spróbuj ponownie</button>}</div> : rows.length ? <div className="project-history-scroll" tabIndex={0} role="region" aria-label="Historia zmian zamówienia">
      <table className="project-history-table"><colgroup><col className="order-history-date-col" /><col className="order-history-axis-col" /><col className="order-history-type-col" /><col /><col /></colgroup>
        <thead><tr><th scope="col"><span className="sr-only">Data zmiany</span></th><th aria-hidden="true"><img src="/figma-assets/orders/history/current.svg" alt="" /></th><th scope="col">Typ zmiany</th><th scope="col">Wcześniej</th><th scope="col">Zmiana na</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.key}><td className="order-history-date"><time dateTime={row.at}><span>{date(row.at, "date")}</span><span>{date(row.at, "time")}</span></time></td><td className="order-history-axis" aria-hidden="true" /><td className="order-history-type">{row.type}</td><td>{row.before}</td><td>{row.after}</td></tr>)}</tbody>
      </table>
    </div> : <p className="order-history-empty">Brak zarejestrowanych zmian zamówienia.</p>}
  </ProviderModal>;
}
export function ProviderSavedOrderHistory({ source, id, onClose }: { source: Project["source"]; id: string; onClose: () => void }) {
  const resource = useSettingsResource<Project>(`projects/${source}/${id}`);
  return <ProviderOrderHistoryDialog entries={resource.data ? projectHistoryEntries(resource.data.history) : []} loading={resource.loading} error={resource.error} reload={resource.reload} onClose={onClose} />;
}
