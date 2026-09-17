import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { AccountProfile } from "./account";
import { fetchPrivateJson } from "./private-api";
import { getProviderProfile } from "./api";
import type { BookingPageProps } from "./booking-client";
import { offerRequestState, requestPricing } from "./offer-request";

export async function loadBookingPage(params: Record<string, string | string[] | undefined>, path: string): Promise<BookingPageProps> {
  const read = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const providerId = read("provider");
  if (!providerId) redirect("/tablica-ogloszen");
  const query = new URLSearchParams();
  for (const key of ["provider", "pricing", "frequency", "addons", "address", "area"]) if (read(key)) query.set(key, read(key));
  const cookieStore = await cookies();
  const email = decodeURIComponent(cookieStore.get("clingo-user-email")?.value ?? "");
  const loginUrl = `/logowanie?next=${encodeURIComponent(`${path}?${query}`)}`;
  if (!email || !cookieStore.get("clingo-session")?.value) redirect(loginUrl);
  const [profile, user] = await Promise.all([
    getProviderProfile(providerId).catch(() => null),
    fetchPrivateJson<{ user: AccountProfile }>("/auth/profile").then(result => result.user)
  ]);
  if (!profile) notFound();
  if (offerRequestState(profile, read("area"), read("address")) !== "ready") {
    query.delete("provider");
    redirect(`/profil-ogloszeniowy/${encodeURIComponent(providerId)}?${query}`);
  }
  const pricingId = requestPricing(profile.pricing!, read("area"), read("pricing"))!.id;
  query.set("pricing", pricingId);
  if (!user) redirect(loginUrl);
  const addOns = read("addons").split(",").filter(Boolean).map(item => { const [id, quantity] = item.split(":"); return { id, quantity: Number(quantity) }; });
  return { profile, user, query: query.toString(), initialAddress: read("address"), selection: {
    providerId, pricingId, frequencyId: read("frequency") || profile.frequencies?.[0]?.id || "", addOns
  } };
}
