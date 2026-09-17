import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function fetchPrivateJson<T>(path: string): Promise<T> {
  const token = (await cookies()).get("clingo-session")?.value;
  if (!token) redirect("/logowanie");
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${path}`, {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(10000)
  });
  if (response.status === 401) redirect("/logowanie");
  if (!response.ok) throw new Error("Nie można pobrać danych konta. Spróbuj ponownie.");
  return response.json();
}
