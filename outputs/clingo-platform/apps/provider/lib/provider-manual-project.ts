import type { AdditionalPosition } from "./provider-single-order";
import type { ProjectSession } from "./provider-projects";
import type { ManualDiscount } from "../../api/src/provider/manual-project-pricing";
import type { ProjectNote, ProjectPhoto } from "../../api/src/provider/project-notes.types";
import type { OrderHistoryEntry } from "../../api/src/provider/order-history";
export type MultiOrderDetailsDraft = { clientId: string; offerId: string; area: string; address: string; quantities: Record<string, number>; positions: AdditionalPosition[] };
export type ManualProjectDraft = MultiOrderDetailsDraft & { requestId: string; offerRevision: number; date: string; sessions: ProjectSession[]; discount: ManualDiscount; basePriceMinor?: number; notes: string; noteItems?: ProjectNote[]; photos?: ProjectPhoto[]; history: string[]; changeHistory?: OrderHistoryEntry[] };
const key = (accountId: string) => `clingo:manual-multi:${accountId}`;
export function storeManualProject(accountId: string, draft: ManualProjectDraft) { sessionStorage.setItem(key(accountId), JSON.stringify(draft)); }
export function readManualProject(accountId: string): ManualProjectDraft | null {
  try {
    const row = JSON.parse(sessionStorage.getItem(key(accountId)) ?? "null");
    if (!row || typeof row.requestId !== "string" || typeof row.clientId !== "string" || typeof row.offerId !== "string" || typeof row.area !== "string" || typeof row.address !== "string" || !Array.isArray(row.sessions) || !Array.isArray(row.positions) || !Array.isArray(row.history) || !row.quantities || !row.discount || typeof row.notes !== "string") return null;
    return row;
  } catch { return null; }
}
export function clearManualProject(accountId: string) { sessionStorage.removeItem(key(accountId)); }
