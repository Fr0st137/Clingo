"use client";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { accountRequest, AccountRequestError } from "../lib/account-client";

let cache: { key: string; expires: number; ids: Set<string> } | undefined;
let pending: { key: string; request: Promise<Set<string>> } | undefined;
function accountKey() { return document.cookie.split("; ").find(cookie => cookie.startsWith("clingo-user-email=")) ?? "guest"; }
async function loadFavorites() {
  const key = accountKey();
  if (cache?.key === key && cache.expires > Date.now()) return cache.ids;
  if (pending?.key === key) return pending.request;
  const request = accountRequest<Array<{ id: string }>>("favorites").then(items => {
    const ids = new Set(items.map(item => item.id));
    if (accountKey() === key) cache = { key, expires: Date.now() + 15000, ids };
    return ids;
  }).finally(() => { if (pending?.request === request) pending = undefined; });
  pending = { key, request };
  return request;
}
export function FavoriteButton({ providerId, initial = false }: { providerId: string; initial?: boolean }) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => { if (cache?.key === accountKey()) setFavorite(cache.ids.has(providerId)); };
    loadFavorites().then(ids => { if (active) setFavorite(ids.has(providerId)); }).catch(error => {
      if (active && !(error instanceof AccountRequestError && error.status === 401)) setStatus("Nie udało się odczytać ulubionych. Kliknij, aby spróbować ponownie.");
    }).finally(() => { if (active) setReady(true); });
    window.addEventListener("clingo-favorites", refresh);
    return () => { active = false; window.removeEventListener("clingo-favorites", refresh); };
  }, [providerId]);
  async function toggle() {
    if (saving) return;
    setSaving(true); setStatus("");
    try {
      // Resolve actual server state before toggling, including after an earlier read failure.
      const ids = await loadFavorites();
      const next = !ids.has(providerId);
      await accountRequest(`favorites/${encodeURIComponent(providerId)}`, next ? "PUT" : "DELETE");
      const updated = new Set(cache?.key === accountKey() ? cache.ids : ids);
      if (next) updated.add(providerId); else updated.delete(providerId);
      cache = { key: accountKey(), ids: updated, expires: Date.now() + 15000 };
      setFavorite(next); window.dispatchEvent(new Event("clingo-favorites")); router.refresh();
    } catch (error) {
      if (error instanceof AccountRequestError && error.status === 401) {
        cache = undefined;
        router.push(`/logowanie?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      } else setStatus(error instanceof Error ? error.message : "Nie udało się zapisać ulubionych.");
    } finally { setSaving(false); }
  }
  return <span className="relative inline-flex shrink-0 flex-col items-end">
    <button aria-label={favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"} aria-pressed={favorite} title={favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      className={`grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full border disabled:opacity-50 ${favorite ? "border-[#0079de] bg-[#e9f5ff] text-[#0079de]" : "border-[#e6edf3] bg-[#f9fafb] text-[#536479]"}`}
      onClick={toggle} disabled={!ready || saving} type="button"><Heart className={`h-[18px] w-[18px] ${favorite ? "fill-current" : ""}`} /></button>
    {status && <span role="alert" className="mt-2 max-w-[220px] text-[12px] text-red-700">{status}</span>}
  </span>;
}
