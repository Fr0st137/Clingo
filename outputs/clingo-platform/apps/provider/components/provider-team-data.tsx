"use client";
import { useEffect, useState } from "react";
import { providerApi, type Employee } from "../lib/provider-client";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    providerApi<Employee[]>("employees", "GET", undefined, controller.signal).then(setEmployees).catch(error => {
      if (!controller.signal.aborted) setError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  return { employees, loading, error, reload: () => setAttempt(value => value + 1) };
}
export function TeamState({ loading, error, reload }: { loading: boolean; error: string; reload: () => void }) {
  if (loading) return <div className="provider-state" role="status">Wczytywanie pracowników…</div>;
  if (error) return <div className="provider-state" role="alert"><p>{error}</p><button type="button" onClick={reload}>Spróbuj ponownie</button></div>;
  return null;
}
