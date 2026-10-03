"use client";

import { useEffect, useState, type FormEvent } from "react";
import { loginDestination, providerApi, type ProviderContext } from "../lib/provider-client";

function destination() {
  const next = new URLSearchParams(window.location.search).get("next");
  return loginDestination(next, window.location.origin);
}
export function ProviderLoginPage() {
  const [context, setContext] = useState<ProviderContext | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    providerApi<ProviderContext>("me", "GET", undefined, controller.signal).then(result => {
      if (result.account) window.location.replace(destination());
      else setContext(result);
    }).catch(() => {}).finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      if (context) {
        await providerApi("account", "POST", { name: data.get("name") });
        window.location.replace(destination());
      } else {
        await providerApi(`auth/${mode}`, "POST", { email: data.get("email"), password: data.get("password") });
        const result = await providerApi<ProviderContext>("me");
        if (result.account) window.location.replace(destination());
        else setContext(result);
      }
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="provider-auth"><img src="/figma-assets/shared/clingo-logo.png" alt="Clingo" /><h1>Panel wykonawcy</h1>{checking ? <p role="status">Sprawdzanie sesji…</p> : <form key={context ? "account" : mode} onSubmit={submit}>
    <h2>{context ? "Twoja działalność" : mode === "login" ? "Zaloguj się" : "Utwórz konto Clingo"}</h2>
    {context ? <><p>Zalogowano jako {context.user.email}. Utworzymy pusty panel dla Twojej działalności.</p><label>Nazwa firmy / działalności<input name="name" required maxLength={180} autoComplete="organization" /></label></> : <><p>Użyj swojego konta Clingo lub załóż nowe.</p><label>Adres e-mail<input name="email" type="email" required maxLength={320} autoComplete="username" /></label><label>Hasło<input name="password" type="password" required minLength={mode === "register" ? 15 : 1} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>{mode === "register" && <p>Hasło musi mieć co najmniej 15 znaków.</p>}</>}
    {error && <p role="alert">{error}</p>}<button className="employee-save-button" disabled={busy}>{busy ? "Zapisywanie…" : context ? "Utwórz panel wykonawcy" : mode === "login" ? "Zaloguj się" : "Załóż konto"}</button>
    {!context && <button type="button" disabled={busy} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Nie mam konta" : "Mam już konto"}</button>}
    {context && <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await providerApi("auth/logout", "POST", {}); setContext(null); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}>Zmień konto</button>}
  </form>}</main>;
}
