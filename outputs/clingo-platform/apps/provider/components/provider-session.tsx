"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, providerApi, type ProviderContext } from "../lib/provider-client";

const Context = createContext<(ProviderContext & { setAccountName: (name: string) => void }) | null>(null);
export const useProvider = () => useContext(Context);

export function ProviderSession({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<ProviderContext | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const setAccountName = useCallback((name: string) => setContext(current => current?.account && current.account.name !== name ? { ...current, account: { ...current.account, name } } : current), []);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    providerApi<ProviderContext>("me", "GET", undefined, controller.signal).then(setContext).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof ApiError ? error.message : "Nie udało się wczytać konta.");
    });
    return () => controller.abort();
  }, [attempt]);
  if (error) return <div className="provider-state" role="alert"><p>{error}</p><button onClick={() => setAttempt(value => value + 1)}>Spróbuj ponownie</button><Link href="/login">Przejdź do logowania</Link></div>;
  if (!context) return <div className="provider-state" role="status">Wczytywanie konta wykonawcy…</div>;
  if (!context.account) return <div className="provider-state"><h1>Uruchom panel swojej działalności</h1><p>Zalogowano jako {context.user.email}. Utwórz konto wykonawcy, aby dodać zespół i godziny pracy.</p><Link className="employee-save-button" href="/login">Skonfiguruj konto</Link></div>;
  return <Context.Provider value={{ ...context, setAccountName }}>{children}</Context.Provider>;
}

export function ProviderLogout() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <><button type="button" className="logout" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try { await providerApi("auth/logout", "POST", {}); window.location.assign("/login"); }
    catch (error) { setError((error as Error).message); setBusy(false); }
  }}><img src="/figma-assets/sidebar/logout.svg" alt="" />{busy ? "Wylogowywanie…" : "Wyloguj się"}</button>{error && <p role="alert">{error}</p>}</>;
}
