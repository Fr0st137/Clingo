"use client";
import { useEffect, useState, type InputHTMLAttributes } from "react";
import { providerApi } from "../lib/provider-client";
import { ProviderModal } from "./provider-modal";

export function useSettingsResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    providerApi<T>(path, "GET", undefined, controller.signal).then(setData).catch(error => {
      if (!controller.signal.aborted) setError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, attempt]);
  return { data, setData, loading, error, reload: () => setAttempt(value => value + 1) };
}
export function SettingsLoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  return <div className="provider-state" role={error ? "alert" : "status"}>{loading ? "Wczytywanie ustawień…" : <><p>{error}</p><button type="button" className="settings-button" onClick={retry}>Spróbuj ponownie</button></>}</div>;
}
export function SettingsInput({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className="settings-live-field"><span>{label}</span><input {...input} /></label>;
}
export function SettingsFeedback({ error, message, conflict, reload }: { error: string; message: string; conflict?: boolean; reload?: () => void }) {
  const [confirmReload, setConfirmReload] = useState(false);
  if (!error && !message) return null;
  return <><div className={`provider-feedback${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>{error || message}{conflict && <button type="button" className="settings-button" onClick={() => setConfirmReload(true)}>Wczytaj aktualne dane</button>}</div>
    {confirmReload && <ProviderModal titleId="settings-reload-title" onClose={() => setConfirmReload(false)}><h2 id="settings-reload-title">Wczytać aktualne dane?</h2><p>Niezapisane zmiany w tym formularzu zostaną zastąpione ostatnią zapisaną wersją.</p><div className="settings-live-actions"><button type="button" className="settings-button" onClick={() => setConfirmReload(false)}>Anuluj</button><button type="button" className="employee-save-button" onClick={() => { setConfirmReload(false); reload?.(); }}>Odrzuć zmiany i wczytaj</button></div></ProviderModal>}</>;
}
const dirtyForms = new Set<symbol>();
const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
const beforeLink = (event: MouseEvent) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest("a") : null;
  if (!link || link.target === "_blank" || link.hasAttribute("download") || !/^https?:$/.test(link.protocol)) return;
  const next = new URL(link.href);
  if (next.origin === window.location.origin && next.pathname === window.location.pathname && next.search === window.location.search) return;
  if (!window.confirm("Opuścić stronę bez zapisywania zmian?")) { event.preventDefault(); event.stopPropagation(); }
};
export function useUnsavedSettings(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const id = Symbol("unsaved-settings");
    dirtyForms.add(id);
    if (dirtyForms.size === 1) {
      window.addEventListener("beforeunload", beforeUnload);
      document.addEventListener("click", beforeLink, true);
    }
    return () => {
      dirtyForms.delete(id);
      if (dirtyForms.size === 0) { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", beforeLink, true); }
    };
  }, [dirty]);
}

