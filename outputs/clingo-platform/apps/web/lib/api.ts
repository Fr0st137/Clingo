import { OrderCardData } from "../components/order-card";
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
  getDashboardFromDb,
  getFavoritesFromDb,
  getOpinionsFromDb,
  getOrderFromDb,
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
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return baseUrl;
}

async function fetchDashboardJson<T>(path: string): Promise<T> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}.`);
  }

  return response.json();
}

export async function getDashboard(): Promise<DashboardPayload> {
  try {
    return await fetchDashboardJson<DashboardPayload>("/dashboard/orders");
  } catch {
    return getDashboardFromDb();
  }
}

export async function getOrder(id: string): Promise<OrderCardData> {
  try {
    return await fetchDashboardJson<OrderCardData>(`/dashboard/orders/${id}`);
  } catch {
    return getOrderFromDb(id);
  }
}

export async function cancelOrder(id: string): Promise<OrderCardData> {
  const baseUrl = apiBaseUrl();

  const response = await fetch(`${baseUrl}/dashboard/orders/${id}/cancel`, {
    method: "PATCH",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Cancel order request failed with status ${response.status}.`);
  }

  return response.json();
}

export async function rescheduleOrder(id: string, startsAt: string, endsAt: string): Promise<OrderCardData> {
  const baseUrl = apiBaseUrl();

  const response = await fetch(`${baseUrl}/dashboard/orders/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({ endsAt, startsAt }),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    }
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
    return await fetchDashboardJson<BoardPayload>("/dashboard/board");
  } catch {
    return getBoardFromDb();
  }
}

export async function getProviderProfile(id: string): Promise<ProviderProfileData> {
  try {
    return await fetchDashboardJson<ProviderProfileData>(`/dashboard/provider-profiles/${id}`);
  } catch {
    return getProviderProfileFromDb(id);
  }
}
