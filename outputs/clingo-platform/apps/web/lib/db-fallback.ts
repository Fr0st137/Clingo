import type { BoardPayload, DashboardPayload, OpinionsPayload, SettingsPayload } from "./api";
import type { ChatPayload } from "../components/chat-view";
import type { FavoriteProviderData } from "../components/favorite-provider-card";
import type { OrderCardData } from "../components/order-card";
import type { ProviderProfileData } from "../components/provider-profile-view";
import type { ReviewCardData } from "../components/review-card";

type QueryResult<T> = {
  rows: T[];
};

type DbClient = {
  connect(): Promise<void>;
  end(): Promise<void>;
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
};

type OrderRow = {
  address: string;
  endsAt: Date | string | null;
  id: string;
  mode: string;
  provider: string;
  serviceType: string;
  startsAt: Date | string | null;
  status: string;
};

const currentUser = {
  initials: "K",
  name: "Kacper Jaskółka",
  phone: "553 068 994"
};

function createClient(): DbClient {
  const { Client } = require("pg") as { Client: new (config: Record<string, unknown>) => DbClient };

  return new Client({
    database: process.env.POSTGRES_DB ?? "clingo",
    host: process.env.POSTGRES_HOST ?? "127.0.0.1",
    password: process.env.POSTGRES_PASSWORD ?? "clingo",
    port: Number(process.env.POSTGRES_PORT ?? 55432),
    user: process.env.POSTGRES_USER ?? "clingo"
  });
}

async function withDb<T>(query: (client: DbClient) => Promise<T>): Promise<T> {
  const client = createClient();
  await client.connect();

  try {
    return await query(client);
  } finally {
    await client.end();
  }
}

function asJson<T>(value: T | string | null): T | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toDate(value: Date | string | null) {
  return value ? new Date(value) : null;
}

function formatDate(value: Date) {
  return capitalize(new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(value));
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("pl-PL", { hour: "numeric", minute: "2-digit" }).format(value);
}

function isCompleted(status: string) {
  const normalized = status.toLowerCase();
  return normalized.includes("wykon") || normalized.includes("zako") || normalized.includes("completed") || normalized.includes("done");
}

function providerVisual(providerName: string) {
  const provider = providerName.toLowerCase();

  if (provider.includes("stepapp")) {
    return { logo: "stepapp" as const };
  }

  if (provider.includes("klaudia")) {
    return { avatar: "klaudia" as const };
  }

  return { avatar: "paulina" as const };
}

function dateLines(order: OrderRow) {
  const startsAt = toDate(order.startsAt);
  const endsAt = toDate(order.endsAt);

  if (!startsAt) {
    return ["Termin do ustalenia"];
  }

  if (!endsAt) {
    return [formatDate(startsAt)];
  }

  const startDate = formatDate(startsAt);
  const endDate = formatDate(endsAt);

  if (startDate !== endDate) {
    return [startDate, endDate];
  }

  return [startDate, formatTime(startsAt), formatTime(endsAt)];
}

function orderActions(status: string) {
  if (isCompleted(status)) {
    return ["Dodaj opinię", "Zamów ponownie"];
  }

  return ["Szczegóły zlecenia", "Przełóż zlecenie", "Odwołaj zlecenie"];
}

function toOrder(row: OrderRow): OrderCardData {
  const lines = dateLines(row);

  return {
    actions: orderActions(row.status),
    address: row.address,
    dateLines: lines,
    details: row.serviceType,
    id: row.id,
    mode: row.mode,
    modeTone: row.mode === "Wielosesyjne" ? "blue" : undefined,
    provider: row.provider,
    range: lines.length === 2,
    status: row.status,
    ...providerVisual(row.provider)
  };
}

export async function getDashboardFromDb(): Promise<DashboardPayload> {
  return withDb(async (client) => {
    const result = await client.query<OrderRow>('select id, provider, status, mode, "serviceType", address, "startsAt", "endsAt" from orders order by "startsAt" asc');
    const orders = result.rows.map(toOrder);

    return {
      completedOrder: orders.find((order) => isCompleted(order.status)) ?? null,
      orders: orders.filter((order) => !isCompleted(order.status)),
      user: currentUser
    };
  });
}

export async function getOrderFromDb(id: string): Promise<OrderCardData> {
  return withDb(async (client) => {
    const result = await client.query<OrderRow>('select id, provider, status, mode, "serviceType", address, "startsAt", "endsAt" from orders where id = $1 limit 1', [id]);

    if (!result.rows[0]) {
      throw new Error("Order not found.");
    }

    return toOrder(result.rows[0]);
  });
}

export async function getFavoritesFromDb(): Promise<FavoriteProviderData[]> {
  return withDb(async (client) => {
    const result = await client.query<FavoriteProviderData>(
      'select f.id, f.name, f."completedServices", f.rating::float as rating, f.reviews, f.experience from favorite_providers f inner join provider_profiles p on p.id = f.id order by f.name asc'
    );
    return result.rows;
  });
}

export async function getChatFromDb(): Promise<ChatPayload> {
  return withDb(async (client) => {
    const [contacts, messages] = await Promise.all([
      client.query<ChatPayload["contacts"][number]>('select id, name, preview, "timeAgo" from chat_contacts order by "orderIndex" asc'),
      client.query<ChatPayload["messages"][number]>('select id, side, text from chat_messages order by "orderIndex" asc')
    ]);

    return {
      contacts: contacts.rows,
      messages: messages.rows
    };
  });
}

export async function getOpinionsFromDb(): Promise<OpinionsPayload> {
  return withDb(async (client) => {
    const result = await client.query<Record<string, unknown>>('select * from panel_reviews where context = $1 order by "orderIndex" asc', ["opinions"]);
    const reviews = result.rows.map(toReview);

    return {
      pendingReviews: reviews
        .filter((review) => result.rows.find((row) => row.id === review.id)?.pending)
        .map(({ avatarTone, id, person, service }) => ({ avatarTone, id, person, service })),
      userReviews: reviews.filter((review) => !result.rows.find((row) => row.id === review.id)?.pending)
    };
  });
}

export async function getReviewsFromDb(context: "regulations" | "standards"): Promise<ReviewCardData[]> {
  return withDb(async (client) => {
    const result = await client.query<Record<string, unknown>>('select * from panel_reviews where context = $1 and pending = false order by "orderIndex" asc', [context]);
    return result.rows.map(toReview);
  });
}

function toReview(row: Record<string, unknown>): ReviewCardData {
  return {
    author: typeof row.author === "string" ? row.author : undefined,
    avatarTone: row.avatarTone as ReviewCardData["avatarTone"],
    content: typeof row.content === "string" ? row.content : undefined,
    date: typeof row.date === "string" ? row.date : undefined,
    editable: Boolean(row.editable),
    id: String(row.id),
    images: asJson<ReviewCardData["images"]>(row.images as string | null) ?? undefined,
    person: String(row.person),
    rating: typeof row.rating === "number" ? row.rating : row.rating ? Number(row.rating) : undefined,
    service: String(row.service)
  };
}

export async function getSettingsFromDb(): Promise<SettingsPayload> {
  return withDb(async (client) => {
    const [sections, notifications, externalConnections] = await Promise.all([
      client.query<Record<string, unknown>>('select id, title, description, fields, "actionLabel" from settings_sections order by "orderIndex" asc'),
      client.query<SettingsPayload["notifications"][number]>('select id, title, description, enabled from notification_settings order by "orderIndex" asc'),
      client.query<SettingsPayload["externalConnections"][number]>('select id, provider, icon from external_connections order by "orderIndex" asc')
    ]);

    return {
      externalConnections: externalConnections.rows,
      notifications: notifications.rows,
      sections: sections.rows.map((section) => ({
        actionLabel: typeof section.actionLabel === "string" ? section.actionLabel : undefined,
        description: String(section.description),
        fields: asJson<SettingsPayload["sections"][number]["fields"]>(section.fields as string | null) ?? undefined,
        id: String(section.id),
        title: String(section.title)
      }))
    };
  });
}

export async function getBoardFromDb(): Promise<BoardPayload> {
  return withDb(async (client) => {
    const [searchFields, filters, listings] = await Promise.all([
      client.query<BoardPayload["searchFields"][number]>('select id, label, value from board_search_fields order by "orderIndex" asc'),
      client.query<Record<string, unknown>>('select id, title, options from board_filters order by "orderIndex" asc'),
      client.query<Record<string, unknown>>('select b.* from board_listings b inner join provider_profiles p on p.id = b.id order by b."orderIndex" asc')
    ]);

    return {
      filters: filters.rows.map((filter) => ({
        id: String(filter.id),
        options: asJson<string[]>(filter.options as string) ?? [],
        title: String(filter.title)
      })),
      listings: listings.rows.map((listing) => ({
        completedOrders: Number(listing.completedOrders),
        experience: String(listing.experience ?? ""),
        id: String(listing.id),
        image: String(listing.image),
        imageFit: typeof listing.imageFit === "string" ? (listing.imageFit as "cover" | "contain") : undefined,
        imageScale: typeof listing.imageScale === "string" ? listing.imageScale : undefined,
        mode: listing.mode as "Jednosesyjne" | "Wielosesyjne",
        modeTone: listing.modeTone as "blue" | "gray",
        price: String(listing.price),
        provider: String(listing.provider),
        rating: Number(listing.rating),
        reviews: Number(listing.reviews)
      })),
      searchFields: searchFields.rows
    };
  });
}

export async function getProviderProfileFromDb(id: string): Promise<ProviderProfileData> {
  return withDb(async (client) => {
    const result = await client.query<Record<string, unknown>>("select * from provider_profiles where id = $1 limit 1", [id]);
    const profile = result.rows[0];

    if (!profile) {
      throw new Error("Provider profile not found.");
    }

    return {
      completedOrders: Number(profile.completedOrders),
      description: String(profile.description),
      experience: String(profile.experience),
      addOns: asJson<ProviderProfileData["addOns"]>(profile.addOns as string | null) ?? undefined,
      frequencies: asJson<ProviderProfileData["frequencies"]>(profile.frequencies as string | null) ?? undefined,
      gallery: asJson<ProviderProfileData["gallery"]>(profile.gallery as string) ?? [],
      id: String(profile.id),
      location: String(profile.location),
      metrics: asJson<ProviderProfileData["metrics"]>(profile.metrics as string) ?? [],
      overview: asJson<ProviderProfileData["overview"]>(profile.overview as string | null) ?? undefined,
      photos: asJson<ProviderProfileData["photos"]>(profile.photos as string | null) ?? undefined,
      priceFrom: String(profile.priceFrom),
      pricing: asJson<ProviderProfileData["pricing"]>(profile.pricing as string | null) ?? undefined,
      provider: String(profile.provider),
      rating: Number(profile.rating),
      reviews: asJson<ProviderProfileData["reviews"]>(profile.reviews as string) ?? [],
      reviewsCount: Number(profile.reviewsCount),
      service: String(profile.service),
      standards: asJson<ProviderProfileData["standards"]>(profile.standards as string) ?? [],
      summary: asJson<ProviderProfileData["summary"]>(profile.summary as string) ?? { duration: "", lines: [], total: "" },
      tags: asJson<ProviderProfileData["tags"]>(profile.tags as string) ?? [],
      verified: Boolean(profile.verified)
    };
  });
}
