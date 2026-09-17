export class AccountRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function accountRequest<T>(path: string, method = "GET", data?: unknown): Promise<T> {
  const response = await fetch(`/api/account/${path}`, { method, cache: "no-store", headers: { "Content-Type": "application/json" },
    ...(method !== "GET" ? { body: JSON.stringify(data ?? {}) } : {}) });
  const payload = await response.json();
  if (!response.ok) throw new AccountRequestError(payload.message || "Nie udało się zapisać zmian.", response.status);
  return payload;
}
