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
  const [verification, setVerification] = useState<{ email: string; expiresAt: string; resendAt: string } | null>(null);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!verification) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [verification]);
  const resendSeconds = verification ? Math.max(0, Math.ceil((Date.parse(verification.resendAt) - now) / 1000)) : 0;
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "register") setMode("register");
    const controller = new AbortController();
    providerApi<ProviderContext>("me", "GET", undefined, controller.signal).then(result => {
      if (result.account) window.location.replace(destination());
      else setContext(result);
    }).catch(async () => { try { setVerification(await providerApi("auth/verification-status", "POST", {})); } catch { /* No pending registration. */ } }).finally(() => { if (!controller.signal.aborted) setChecking(false); });
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
        const auth = verification
          ? await providerApi<{ verificationRequired?: boolean; email: string; expiresAt: string; resendAt: string }>("auth/verify-email", "POST", { code })
          : await providerApi<{ verificationRequired?: boolean; email: string; expiresAt: string; resendAt: string }>(`auth/${mode}`, "POST", { email: data.get("email"), password: data.get("password") });
        if (auth.verificationRequired) { setVerification(auth); setCode(""); setNow(Date.now()); return; }
        setVerification(null);
        const result = await providerApi<ProviderContext>("me");
        if (result.account) window.location.replace(destination());
        else setContext(result);
      }
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="provider-auth"><img src="/figma-assets/shared/clingo-logo.png" alt="Clingo" /><h1>Panel wykonawcy</h1>{checking ? <p role="status">Sprawdzanie sesji…</p> : <form key={context ? "account" : verification ? "activation" : mode} onSubmit={submit}>
    <h2>{context ? "Twoja działalność" : verification ? "Aktywuj konto" : mode === "login" ? "Zaloguj się" : "Utwórz konto Clingo"}</h2>
    {context ? <><p>Zalogowano jako {context.user.email}. Utworzymy pusty panel dla Twojej działalności.</p><label>Nazwa firmy / działalności<input name="name" required maxLength={180} autoComplete="organization" /></label></> : verification ? <><p>Wpisz czterocyfrowy kod wysłany na {verification.email}.</p><label>Kod aktywacyjny<input aria-label="Kod aktywacyjny" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" maxLength={4} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))} /></label><button type="button" disabled={busy || resendSeconds > 0} onClick={async () => { setBusy(true); setError(""); try { setVerification(await providerApi("auth/resend-verification", "POST", {})); setCode(""); setNow(Date.now()); } catch (failure) { setError((failure as Error).message); } finally { setBusy(false); } }}>Wyślij kod ponownie{resendSeconds ? ` (${resendSeconds}s)` : ""}</button></> : <><p>Użyj swojego konta Clingo lub załóż nowe.</p><label>Adres e-mail<input name="email" type="email" required maxLength={320} autoComplete="username" /></label><label>Hasło<input name="password" type="password" required minLength={mode === "register" ? 15 : 1} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>{mode === "register" && <p>Hasło musi mieć co najmniej 15 znaków.</p>}</>}
    {error && <p role="alert">{error}</p>}<button className="employee-save-button" disabled={busy}>{busy ? "Zapisywanie…" : context ? "Utwórz panel wykonawcy" : verification ? "Aktywuj konto" : mode === "login" ? "Zaloguj się" : "Załóż konto"}</button>
    {!context && <button type="button" disabled={busy} onClick={() => { setMode(verification ? "login" : mode === "login" ? "register" : "login"); setVerification(null); setError(""); }}>{verification ? "Wróć do logowania" : mode === "login" ? "Nie mam konta" : "Mam już konto"}</button>}
    {context && <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await providerApi("auth/logout", "POST", {}); setContext(null); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}>Zmień konto</button>}
  </form>}</main>;
}
