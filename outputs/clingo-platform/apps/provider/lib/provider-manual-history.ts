import { attachmentHistoryDiff, historyMoney, orderHistoryDiff, type HistorySnapshot } from "../../api/src/provider/order-history";
import { legacyProjectNotes } from "../../api/src/provider/project-notes.types";
import { manualProjectPricing } from "../../api/src/provider/manual-project-pricing";
import type { ManualProjectDraft } from "./provider-manual-project";
import type { Offer } from "./provider-offers";

export function manualHistoryChanges(before: ManualProjectDraft, after: ManualProjectDraft, offers: Offer[], clients: Array<{ id: string; name: string }>) {
  const snapshot = (draft: ManualProjectDraft): HistorySnapshot => {
    const offer = offers.find(row => row.id === draft.offerId);
    let quote: ReturnType<typeof manualProjectPricing> | undefined;
    try { if (offer) quote = manualProjectPricing(offer.configuration, { ...draft, areaSquareMeters: Number(draft.area.replace(",", ".")) }); } catch { /* An incomplete price input is recorded once it becomes valid. */ }
    return { sessions: draft.sessions, fields: {
      "Zmiana klienta": clients.find(row => row.id === draft.clientId)?.name ?? "—",
      "Zmiana usługi": offer?.title ?? "—", "Zmiana powierzchni": `${draft.area} m²`, "Zmiana adresu": draft.address,
      ...(quote ? { "Zmiana ceny": historyMoney(quote.total), "Zmiana usług dodatkowych": [...quote.extras.map(row => `${row.title} × ${row.quantity}`), ...quote.positions.map(row => `${row.title} × ${row.quantity}: ${historyMoney(row.amount)}`)].join("\n") || "Brak" } : {}),
    } };
  };
  const previous = snapshot(before), next = snapshot(after);
  for (const field of ["Zmiana ceny", "Zmiana usług dodatkowych"]) if (previous.fields?.[field] === undefined || next.fields?.[field] === undefined) { delete previous.fields?.[field]; delete next.fields?.[field]; }
  const attachments = (draft: ManualProjectDraft) => ({ noteItems: draft.noteItems ?? legacyProjectNotes(draft.notes, draft.requestId), photos: draft.photos ?? [] });
  return [...orderHistoryDiff(previous, next), ...attachmentHistoryDiff(attachments(before), attachments(after))];
}
