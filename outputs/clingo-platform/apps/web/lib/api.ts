import { OrderCardData } from "../components/order-card";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchOrderData, OrderApiResponseError } from "./order-api";
import { FavoriteProviderData } from "../components/favorite-provider-card";
import { ChatPayload } from "../components/chat-view";
import { BoardListingData } from "../components/board-listing-card";
import { FilterGroupData } from "../components/board-filters";
import { ProviderProfileData } from "../components/provider-profile-view";
import { SearchFieldData } from "../components/public-search-bar";
import { PendingReviewData, ReviewCardData } from "../components/review-card";
import {
  ExternalConnectionData,
  NotificationSettingData,
  SettingsSectionData
} from "../components/settings-section";
import {
  getBoardFromDb,
  getChatFromDb,
  getFavoritesFromDb,
  getOpinionsFromDb,
  getProviderProfileFromDb,
  getReviewsFromDb,
  getSettingsFromDb
} from "./db-fallback";

export type DashboardPayload = {
  user: {
    initials: string;
    name: string;
    phone: string;
  };
  orders: OrderCardData[];
  completedOrder: OrderCardData | null;
};

export type OpinionsPayload = {
  pendingReviews: PendingReviewData[];
  userReviews: ReviewCardData[];
};

export type SettingsPayload = {
  sections: SettingsSectionData[];
  notifications: NotificationSettingData[];
  externalConnections: ExternalConnectionData[];
};

export type BoardPayload = {
  searchFields: SearchFieldData[];
  filters: FilterGroupData[];
  listings: BoardListingData[];
};

function apiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return baseUrl;
}

async function fetchDashboardJson<T>(path: string): Promise<T> {
  noStore();
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(3000)
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}.`);
  }

  return response.json();
}

// Only the public catalogue is shared between visitors. Orders and account
// data must always go through their authenticated, uncached requests.
async function fetchCatalogueJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    next: { revalidate: 30 },
    signal: AbortSignal.timeout(3000)
  });
  if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}.`);
  return response.json();
}

export async function getDashboard(email: string): Promise<DashboardPayload> {
  return fetchOrderJson<DashboardPayload>("/dashboard/orders");
}

export async function getOrder(id: string, email: string): Promise<OrderCardData> {
  return fetchOrderJson<OrderCardData>(`/dashboard/orders/${encodeURIComponent(id)}`);
}

async function orderHeaders() {
  const store = await cookies();
  const token = store.get("clingo-session")?.value;
  if (!token) redirect("/logowanie?next=%2Fzamowienia");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function fetchOrderJson<T>(path: string): Promise<T> {
  const headers = await orderHeaders();
  try {
    return await fetchOrderData<T>(`${apiBaseUrl()}${path}`, headers);
  } catch (error) {
    if (error instanceof OrderApiResponseError && error.status === 401) {
      redirect("/logowanie?next=%2Fzamowienia");
    }
    throw error;
  }
}

export async function cancelOrder(id: string, email: string): Promise<OrderCardData> {
  const baseUrl = apiBaseUrl();

  const response = await fetch(`${baseUrl}/dashboard/orders/${id}/cancel?email=${encodeURIComponent(email)}`, {
    headers: await orderHeaders(),
    method: "PATCH",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Cancel order request failed with status ${response.status}.`);
  }

  return response.json();
}

export async function rescheduleOrder(id: string, email: string, startsAt: string, endsAt: string): Promise<OrderCardData> {
  const baseUrl = apiBaseUrl();

  const response = await fetch(`${baseUrl}/dashboard/orders/${id}/reschedule?email=${encodeURIComponent(email)}`, {
    method: "PATCH",
    body: JSON.stringify({ endsAt, startsAt }),
    cache: "no-store",
    headers: await orderHeaders()
  });

  if (!response.ok) {
    throw new Error(`Reschedule order request failed with status ${response.status}.`);
  }

  return response.json();
}

export async function getFavorites(): Promise<FavoriteProviderData[]> {
  try {
    return await fetchDashboardJson<FavoriteProviderData[]>("/dashboard/favorites");
  } catch {
    return getFavoritesFromDb();
  }
}

export async function getChat(): Promise<ChatPayload> {
  try {
    return await fetchDashboardJson<ChatPayload>("/dashboard/chat");
  } catch {
    return getChatFromDb();
  }
}

export async function getOpinions(): Promise<OpinionsPayload> {
  try {
    return await fetchDashboardJson<OpinionsPayload>("/dashboard/reviews/opinions");
  } catch {
    return getOpinionsFromDb();
  }
}

export async function getStandardsReviews(): Promise<ReviewCardData[]> {
  try {
    return await fetchDashboardJson<ReviewCardData[]>("/dashboard/reviews/standards");
  } catch {
    return getReviewsFromDb("standards");
  }
}

export async function getRegulationsReviews(): Promise<ReviewCardData[]> {
  try {
    return await fetchDashboardJson<ReviewCardData[]>("/dashboard/reviews/regulations");
  } catch {
    return getReviewsFromDb("regulations");
  }
}

export async function getSettings(): Promise<SettingsPayload> {
  try {
    return await fetchDashboardJson<SettingsPayload>("/dashboard/settings");
  } catch {
    return getSettingsFromDb();
  }
}

export async function getBoard(): Promise<BoardPayload> {
  try {
    return await fetchCatalogueJson<BoardPayload>("/dashboard/board");
  } catch {
    return getBoardFromDb();
  }
}

export async function getProviderProfile(id: string): Promise<ProviderProfileData> {
  try {
    return await fetchCatalogueJson<ProviderProfileData>(`/dashboard/provider-profiles/${encodeURIComponent(id)}`);
  } catch {
    return getProviderProfileFromDb(id);
  }
}
