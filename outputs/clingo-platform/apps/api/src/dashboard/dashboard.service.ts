import { BadRequestException, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import Redis from "ioredis";
import { Repository } from "typeorm";
import { REDIS_CLIENT } from "../redis/redis.module";
import { BoardFilterEntity } from "./board-filter.entity";
import { BoardListingEntity } from "./board-listing.entity";
import { BoardSearchFieldEntity } from "./board-search-field.entity";
import { ChatContactEntity } from "./chat-contact.entity";
import { ChatMessageEntity } from "./chat-message.entity";
import {
  BoardPayload,
  ChatContact,
  ChatMessage,
  DashboardOrder,
  DashboardPayload,
  ExternalConnection,
  FavoriteProvider,
  NotificationSetting,
  OpinionsPayload,
  PanelReview,
  ProviderProfile,
  SettingsPayload,
  SettingsSection
} from "./dashboard.types";
import { ExternalConnectionEntity } from "./external-connection.entity";
import { FavoriteProviderEntity } from "./favorite-provider.entity";
import { NotificationSettingEntity } from "./notification-setting.entity";
import { OrderEntity } from "./order.entity";
import { PanelReviewEntity } from "./panel-review.entity";
import { ProviderProfileEntity } from "./provider-profile.entity";
import { SettingsSectionEntity } from "./settings-section.entity";

const dashboardCacheKey = "dashboard:orders:kacper-jaskolka";

const currentUser = {
  name: "Kacper Jaskółka",
  phone: "553 068 994",
  initials: "K"
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

function providerVisual(order: OrderEntity) {
  const provider = order.provider.toLowerCase();

  if (provider.includes("stepapp")) {
    return { logo: "stepapp" };
  }

  if (provider.includes("klaudia")) {
    return { avatar: "klaudia" };
  }

  return { avatar: "paulina" };
}

function dateLines(order: OrderEntity) {
  if (!order.startsAt) {
    return ["Termin do ustalenia"];
  }

  if (!order.endsAt) {
    return [formatDate(order.startsAt)];
  }

  const startDate = formatDate(order.startsAt);
  const endDate = formatDate(order.endsAt);

  if (startDate !== endDate) {
    return [startDate, endDate];
  }

  return [startDate, formatTime(order.startsAt), formatTime(order.endsAt)];
}

function orderActions(order: OrderEntity) {
  if (isCompleted(order.status)) {
    return ["Dodaj opinię", "Zamów ponownie"];
  }

  return ["Szczegóły zlecenia", "Przełóż zlecenie", "Odwołaj zlecenie"];
}

function toDashboardOrder(order: OrderEntity): DashboardOrder {
  const lines = dateLines(order);

  return {
    id: order.id,
    status: order.status,
    mode: order.mode,
    modeTone: order.mode === "Wielosesyjne" ? ("blue" as const) : undefined,
    provider: order.provider,
    details: order.serviceType,
    address: order.address,
    dateLines: lines,
    range: lines.length === 2,
    actions: orderActions(order),
    ...providerVisual(order)
  };
}

function toFavorite(entity: FavoriteProviderEntity): FavoriteProvider {
  return {
    id: entity.id,
    name: entity.name,
    completedServices: entity.completedServices,
    rating: Number(entity.rating),
    reviews: entity.reviews,
    experience: entity.experience
  };
}

function toReview(entity: PanelReviewEntity): PanelReview {
  return {
    id: entity.id,
    person: entity.person,
    service: entity.service,
    author: entity.author ?? undefined,
    rating: entity.rating ?? undefined,
    date: entity.date ?? undefined,
    content: entity.content ?? undefined,
    images: entity.images ?? undefined,
    avatarTone: entity.avatarTone,
    editable: entity.editable
  };
}

function toSettingsSection(entity: SettingsSectionEntity): SettingsSection {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    fields: entity.fields ?? undefined,
    actionLabel: entity.actionLabel ?? undefined
  };
}

type SeedProviderPhoto = {
  id: string;
  label: string;
  galleryGradient: string;
  photoGradient: string;
};

type SeedProviderProfileConfig = {
  id: string;
  provider: string;
  service: string;
  location: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  completedOrders: number;
  priceFrom: string;
  tags: string[];
  description: string;
  photos: SeedProviderPhoto[];
  pricing: ProviderProfile["pricing"];
  frequencies: ProviderProfile["frequencies"];
  addOns: ProviderProfile["addOns"];
  reviews: ProviderProfile["reviews"];
  standards: string[];
  summary: ProviderProfile["summary"];
};

function createSeedProviderProfile(config: SeedProviderProfileConfig): ProviderProfile {
  const rating = config.rating.toFixed(1);

  return {
    id: config.id,
    provider: config.provider,
    verified: true,
    service: config.service,
    location: config.location,
    rating: config.rating,
    reviewsCount: config.reviewsCount,
    experience: config.experience,
    completedOrders: config.completedOrders,
    priceFrom: config.priceFrom,
    tags: config.tags,
    description: config.description,
    metrics: [
      { id: "rating", label: "Średnia ocena", value: rating },
      { id: "orders", label: "Wykonane usługi", value: String(config.completedOrders) },
      { id: "experience", label: "Doświadczenie", value: config.experience },
      { id: "location", label: "Obsługiwany obszar", value: "Warszawa" }
    ],
    gallery: config.photos.slice(0, 3).map((photo) => ({
      id: photo.id,
      label: photo.label,
      gradient: photo.galleryGradient
    })),
    overview: [
      { id: "rating", label: "Ocena", value: rating },
      { id: "reviews", label: "Opinie", value: String(config.reviewsCount) },
      { id: "orders", label: "Wykonane usługi", value: String(config.completedOrders) },
      { id: "experience", label: "Doświadczenie", value: config.experience }
    ],
    photos: config.photos.map((photo) => ({
      id: photo.id,
      label: photo.label,
      gradient: photo.photoGradient
    })),
    pricing: config.pricing,
    frequencies: config.frequencies,
    addOns: config.addOns,
    reviews: config.reviews,
    standards: config.standards,
    summary: config.summary
  };
}

@Injectable()
export class DashboardService implements OnModuleInit {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectRepository(BoardFilterEntity) private readonly boardFiltersRepository: Repository<BoardFilterEntity>,
    @InjectRepository(BoardListingEntity) private readonly boardListingsRepository: Repository<BoardListingEntity>,
    @InjectRepository(BoardSearchFieldEntity) private readonly boardSearchFieldsRepository: Repository<BoardSearchFieldEntity>,
    @InjectRepository(ChatContactEntity) private readonly chatContactsRepository: Repository<ChatContactEntity>,
    @InjectRepository(ChatMessageEntity) private readonly chatMessagesRepository: Repository<ChatMessageEntity>,
    @InjectRepository(ExternalConnectionEntity) private readonly externalConnectionsRepository: Repository<ExternalConnectionEntity>,
    @InjectRepository(FavoriteProviderEntity) private readonly favoritesRepository: Repository<FavoriteProviderEntity>,
    @InjectRepository(NotificationSettingEntity) private readonly notificationsRepository: Repository<NotificationSettingEntity>,
    @InjectRepository(OrderEntity) private readonly ordersRepository: Repository<OrderEntity>,
    @InjectRepository(PanelReviewEntity) private readonly reviewsRepository: Repository<PanelReviewEntity>,
    @InjectRepository(ProviderProfileEntity) private readonly providerProfilesRepository: Repository<ProviderProfileEntity>,
    @InjectRepository(SettingsSectionEntity) private readonly settingsSectionsRepository: Repository<SettingsSectionEntity>
  ) {}

  async onModuleInit() {
    await this.seedDashboardData();
  }

  async getDashboard(): Promise<DashboardPayload> {
    try {
      if (this.redis.status === "wait") {
        await this.redis.connect();
      }

      const cached = await this.redis.get(dashboardCacheKey);
      if (cached) {
        return JSON.parse(cached) as DashboardPayload;
      }
    } catch {
      // Redis is optional; PostgreSQL remains the source of truth.
    }

    const orders = await this.ordersRepository.find({
      order: {
        startsAt: "ASC"
      }
    });

    const upcoming = orders.filter((order) => !isCompleted(order.status)).map(toDashboardOrder);
    const completedOrder = orders.find((order) => isCompleted(order.status));

    const payload: DashboardPayload = {
      user: currentUser,
      orders: upcoming,
      completedOrder: completedOrder ? toDashboardOrder(completedOrder) : null
    };

    try {
      await this.redis.set(dashboardCacheKey, JSON.stringify(payload), "EX", 60);
    } catch {
      // Cache write failure should not block real dashboard data.
    }

    return payload;
  }

  async getOrder(id: string): Promise<DashboardOrder | null> {
    const order = await this.ordersRepository.findOne({ where: { id } });
    return order ? toDashboardOrder(order) : null;
  }

  async cancelOrder(id: string): Promise<DashboardOrder | null> {
    const order = await this.ordersRepository.findOne({ where: { id } });

    if (!order) {
      return null;
    }

    order.status = "Odwołane zlecenie";
    const saved = await this.ordersRepository.save(order);
    await this.clearDashboardCache();

    return toDashboardOrder(saved);
  }

  async rescheduleOrder(id: string, startsAt: Date, endsAt: Date): Promise<DashboardOrder | null> {
    const order = await this.ordersRepository.findOne({ where: { id } });

    if (!order) {
      return null;
    }

    order.startsAt = startsAt;
    order.endsAt = endsAt;
    const saved = await this.ordersRepository.save(order);
    await this.clearDashboardCache();

    return toDashboardOrder(saved);
  }

  async getFavorites(): Promise<FavoriteProvider[]> {
    const [favorites, providerProfiles] = await Promise.all([
      this.favoritesRepository.find({ order: { name: "ASC" } }),
      this.providerProfilesRepository.find({ select: ["id"] })
    ]);
    const profileIds = new Set(providerProfiles.map((profile) => profile.id));

    return favorites.filter((favorite) => profileIds.has(favorite.id)).map(toFavorite);
  }

  async getChat(): Promise<{ contacts: ChatContact[]; messages: ChatMessage[] }> {
    const [contacts, messages] = await Promise.all([
      this.chatContactsRepository.find({ order: { orderIndex: "ASC" } }),
      this.chatMessagesRepository.find({ order: { orderIndex: "ASC" } })
    ]);

    return {
      contacts: contacts.map(({ id, name, preview, timeAgo }) => ({ id, name, preview, timeAgo })),
      messages: messages.map(({ id, side, text }) => ({ id, side, text }))
    };
  }

  async getOpinions(): Promise<OpinionsPayload> {
    const reviews = await this.reviewsRepository.find({
      order: { orderIndex: "ASC" },
      where: { context: "opinions" }
    });

    return {
      pendingReviews: reviews
        .filter((review) => review.pending)
        .map(({ id, person, service, avatarTone }) => ({ id, person, service, avatarTone })),
      userReviews: reviews.filter((review) => !review.pending).map(toReview)
    };
  }

  async saveOpinion(
    id: string,
    input: { content?: string; images?: Array<{ id: string; label: string }>; rating?: number }
  ): Promise<PanelReview | null> {
    const review = await this.reviewsRepository.findOne({ where: { context: "opinions", id } });

    if (!review) {
      return null;
    }

    const rating = Number(input.rating);
    const content = (input.content ?? "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException("Rating must be between 1 and 5.");
    }

    if (!content || content.length > 1000) {
      throw new BadRequestException("Review content must be between 1 and 1000 characters.");
    }

    review.pending = false;
    review.editable = true;
    review.rating = rating;
    review.content = content;
    review.date = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
    review.images = (input.images ?? [])
      .slice(0, 3)
      .map((image, index) => ({
        id: String(image.id || `review-image-${index + 1}`),
        label: String(image.label || `Zdjęcie ${index + 1}`)
      }));

    const savedReview = await this.reviewsRepository.save(review);

    return toReview(savedReview);
  }

  async getReviews(context: "regulations" | "standards"): Promise<PanelReview[]> {
    const reviews = await this.reviewsRepository.find({
      order: { orderIndex: "ASC" },
      where: { context, pending: false }
    });

    return reviews.map(toReview);
  }

  async getSettings(): Promise<SettingsPayload> {
    const [sections, notifications, externalConnections] = await Promise.all([
      this.settingsSectionsRepository.find({ order: { orderIndex: "ASC" } }),
      this.notificationsRepository.find({ order: { orderIndex: "ASC" } }),
      this.externalConnectionsRepository.find({ order: { orderIndex: "ASC" } })
    ]);

    return {
      sections: sections.map(toSettingsSection),
      notifications: notifications.map(({ id, title, description, enabled }) => ({ id, title, description, enabled })),
      externalConnections: externalConnections.map(({ id, provider, icon }) => ({ id, provider, icon }))
    };
  }

  async getBoard(): Promise<BoardPayload> {
    const [searchFields, filters, listings, providerProfiles] = await Promise.all([
      this.boardSearchFieldsRepository.find({ order: { orderIndex: "ASC" } }),
      this.boardFiltersRepository.find({ order: { orderIndex: "ASC" } }),
      this.boardListingsRepository.find({ order: { orderIndex: "ASC" } }),
      this.providerProfilesRepository.find({ select: ["id"] })
    ]);
    const profileIds = new Set(providerProfiles.map((profile) => profile.id));

    return {
      searchFields: searchFields.map(({ id, label, value }) => ({ id, label, value })),
      filters: filters.map(({ id, title, options }) => ({ id, title, options })),
      listings: listings.filter((listing) => profileIds.has(listing.id)).map((listing) => ({
        id: listing.id,
        provider: listing.provider,
        rating: Number(listing.rating),
        reviews: listing.reviews,
        experience: listing.experience,
        price: listing.price,
        completedOrders: listing.completedOrders,
        mode: listing.mode,
        modeTone: listing.modeTone,
        image: listing.image,
        imageFit: listing.imageFit ?? undefined,
        imageScale: listing.imageScale ?? undefined
      }))
    };
  }

  async getProviderProfile(id: string): Promise<ProviderProfile | null> {
    const profile = await this.providerProfilesRepository.findOne({ where: { id } });

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      rating: Number(profile.rating)
    };
  }

  private async clearDashboardCache() {
    try {
      await this.redis.del(dashboardCacheKey);
    } catch {
      // Cache invalidation failure should not block writes.
    }
  }

  private async seedDashboardData() {
    await Promise.all([
      this.seedOrders(),
      this.seedFavorites(),
      this.seedChat(),
      this.seedReviews(),
      this.seedSettings(),
      this.seedBoard(),
      this.seedProviderProfiles()
    ]);
  }

  private async seedOrders() {
    if ((await this.ordersRepository.count()) > 0) {
      return;
    }

    await this.ordersRepository.save([
      {
        provider: "Paulina Jagielska",
        status: "Zlecenie w trakcie",
        mode: "Jednosesyjne",
        serviceType: "Sprzątanie obiektów · Mieszkań i domów",
        address: "Warszawa, Floriańska 48/16",
        location: null,
        startsAt: new Date("2026-08-14T08:45:00+02:00"),
        endsAt: new Date("2026-08-14T10:30:00+02:00")
      },
      {
        provider: "Klaudia Nowak",
        status: "Zaplanowane zlecenie",
        mode: "Wielosesyjne",
        serviceType: "Sprzątanie obiektów · Biur i lokali użytkowych",
        address: "Warszawa, Marszałkowska 12",
        location: null,
        startsAt: new Date("2026-08-18T12:00:00+02:00"),
        endsAt: new Date("2026-08-20T16:00:00+02:00")
      },
      {
        provider: "Stepapp",
        status: "Wykonane zlecenie",
        mode: "Jednosesyjne",
        serviceType: "Sprzątanie obiektów · Mieszkań i domów",
        address: "Warszawa, Wilcza 31",
        location: null,
        startsAt: new Date("2026-07-24T09:00:00+02:00"),
        endsAt: new Date("2026-07-24T12:00:00+02:00")
      }
    ]);
  }

  private async seedFavorites() {
    if ((await this.favoritesRepository.count()) > 0) {
      return;
    }

    await this.favoritesRepository.save([
      { id: "stepapp", name: "Stepapp", completedServices: 166, rating: 4.0, reviews: 27, experience: "5 lata" },
      { id: "paulina-jagielska", name: "Paulina Jagielska", completedServices: 87, rating: 5.0, reviews: 42, experience: "3 lata" }
    ]);
  }

  private async seedChat() {
    if ((await this.chatContactsRepository.count()) === 0) {
      await this.chatContactsRepository.save([
        { id: "anita-kowalska", name: "Anita Kowalska", preview: "Dzień dobry, chciałbym popro...", timeAgo: "2 godz.", orderIndex: 0 },
        { id: "kajetan-mrowczynski", name: "Kajetan Mrowczyński", preview: "Ty: Dziękuję.", timeAgo: "6 godz.", orderIndex: 1 },
        { id: "elzbieta-antkowiak", name: "Elżbieta Antkowiak", preview: "Do zobaczenia, pokażę Pani n...", timeAgo: "1 dzień", orderIndex: 2 },
        { id: "jolanta-bartusiak", name: "Jolanta Bartusiak", preview: "Pod antresolą", timeAgo: "1 tydzień", orderIndex: 3 },
        { id: "aleksander-twarowski", name: "Aleksander Twarowski", preview: "Ty: Nie ma żadnego problemu.", timeAgo: "2 dni", orderIndex: 4 },
        { id: "magdalena-wojcik", name: "Magdalena Wójcik", preview: "Pozdrawiam i do zobaczenia.", timeAgo: "3 dni", orderIndex: 5 },
        { id: "michal-trybulec", name: "Michał Trybulec", preview: "Dzień dobry, chciałbym poprosić...", timeAgo: "3 dni", orderIndex: 6 },
        { id: "maryla-kacprowska", name: "Maryla Kacprowska", preview: "Ty: Zatem do zobaczenia.", timeAgo: "4 dni", orderIndex: 7 }
      ]);
    }

    if ((await this.chatMessagesRepository.count()) > 0) {
      return;
    }

    await this.chatMessagesRepository.save([
      {
        id: "m1",
        side: "mine",
        text: "Dziękuję za złożenie zamówienia. Chciałabym dopytać o kwestię przekazania kluczy do mieszkania. Czy będzie Pani obecna w dniu sprzątania, czy klucze będą pozostawione w umówionym miejscu?",
        orderIndex: 0
      },
      {
        id: "m2",
        side: "theirs",
        text: "Dzień dobry. Nie będę mogła być na miejscu, więc klucze mogę zostawić w skrzynce na listy, kod to 5284.",
        orderIndex: 1
      },
      {
        id: "m3",
        side: "mine",
        text: "Dziękuję za informację. Po zakończeniu sprzątania mogę odłożyć klucze w to samo miejsce.",
        orderIndex: 2
      },
      {
        id: "m4",
        side: "theirs",
        text: "Tak, jak najbardziej. Proszę tylko pamiętać, żeby dobrze przekręcić zamek, czasami się zacina.",
        orderIndex: 3
      },
      {
        id: "m5",
        side: "mine",
        text: "Jasne, dziękuję za wskazówkę. Sprzątanie wykonam zgodnie z zamówieniem w czwartek o 16:00.",
        orderIndex: 4
      },
      {
        id: "m6",
        side: "theirs",
        text: "Świetnie, bardzo dziękuję za kontakt.",
        orderIndex: 5
      },
      {
        id: "m7",
        side: "mine",
        text: "Po zakończeniu wyślę krótką wiadomość potwierdzającą odbiór kluczy.",
        orderIndex: 6
      }
    ]);
  }

  private async seedReviews() {
    if ((await this.reviewsRepository.count()) > 0) {
      return;
    }

    const baseReviews = [
      {
        id: "paulina-jagielska",
        person: "Paulina Jagielska",
        service: "Sprzątanie obiektów · Biur i lokali użytkowych",
        rating: 5,
        date: "11 Sier 2025",
        content:
          "Pani Paulina wykonała wyjątkową pracę, sprzątając nasze trzypokojowe mieszkanie. Była punktualna, dokładna i bardzo profesjonalna. Dbałość o szczegóły zrobiła wrażenie.",
        images: [
          { id: "salon", label: "Salon po sprzątaniu" },
          { id: "kuchnia", label: "Kuchnia po sprzątaniu" },
          { id: "pokoj", label: "Pokój po sprzątaniu" }
        ],
        avatarTone: "person" as const,
        editable: true
      },
      {
        id: "stepapp",
        person: "Stepapp",
        service: "Sprzątanie obiektów · Biur i lokali użytkowych",
        rating: 5,
        date: "11 Cze 2025",
        content: "Super!",
        images: null,
        avatarTone: "brand" as const,
        editable: true
      },
      {
        id: "karolina-pokulska-reviewed",
        person: "Karolina Pokulska",
        service: "Sprzątanie obiektów · Biur i lokali użytkowych",
        rating: 5,
        date: "22 Maj 2025",
        content: "Pani Karolina spisała się znakomicie - mieszkanie po sprzątaniu wyglądało jak nowe.",
        images: null,
        avatarTone: "person" as const,
        editable: true
      },
      {
        id: "anna-kowal",
        person: "Anna Kowal",
        service: "Sprzątanie obiektów · Mieszkań i domów",
        rating: 5,
        date: "3 Sie 2026",
        content: "Bardzo sprawna realizacja. Mieszkanie po usłudze było dokładnie posprzątane, a kontakt przebiegł bezproblemowo.",
        images: null,
        avatarTone: "person" as const,
        editable: true
      },
      {
        id: "dom-clean",
        person: "Dom Clean",
        service: "Sprzątanie obiektów · Mieszkań i domów",
        rating: 4,
        date: "28 Lip 2026",
        content: "Usługa wykonana terminowo. Szczególnie dobrze posprzątana kuchnia i łazienka.",
        images: null,
        avatarTone: "brand" as const,
        editable: true
      },
      {
        id: "mobimop-review",
        person: "MobiMop",
        service: "Sprzątanie obiektów · Mieszkań i domów",
        rating: 5,
        date: "12 Lip 2026",
        content: "Dobry kontakt, jasne ustalenia i dokładnie wykonany zakres prac.",
        images: null,
        avatarTone: "brand" as const,
        editable: true
      }
    ];

    await this.reviewsRepository.save([
      {
        id: "karolina-pokulska-pending",
        context: "opinions",
        pending: true,
        person: "Karolina Pokulska",
        service: "Sprzątanie obiektów · Biur i lokali użytkowych",
        author: null,
        rating: null,
        date: null,
        content: null,
        images: null,
        avatarTone: "person",
        editable: false,
        orderIndex: 0
      },
      {
        id: "pending-magdalena-wojcik",
        context: "opinions",
        pending: true,
        person: "Magdalena Wójcik",
        service: "Sprzątanie obiektów · Mieszkań i domów",
        author: null,
        rating: null,
        date: null,
        content: null,
        images: null,
        avatarTone: "person",
        editable: false,
        orderIndex: 1
      },
      ...baseReviews.map((review, index) => ({ ...review, id: `opinion-${review.id}`, context: "opinions" as const, pending: false, author: null, orderIndex: index + 2 })),
      ...baseReviews.map((review, index) => ({ ...review, id: `standard-${review.id}`, context: "standards" as const, pending: false, author: "Kacper Jaskółka", orderIndex: index })),
      ...baseReviews.map((review, index) => ({ ...review, id: `regulation-${review.id}`, context: "regulations" as const, pending: false, author: "Kacper Jaskółka", orderIndex: index }))
    ]);
  }

  private async seedSettings() {
    if ((await this.settingsSectionsRepository.count()) === 0) {
      await this.settingsSectionsRepository.save([
        {
          id: "personal",
          title: "Informacje personalne",
          description: "Zarządzaj swoimi danymi kontaktowymi.",
          fields: [
            { id: "name", label: "Imię i nazwisko", value: "Kacper Jaskółka" },
            { id: "birthDate", label: "Data urodzenia", value: "", placeholder: "DD-MM-RRRR" },
            { id: "email", label: "Adres e-mail", value: "kacper.jaskolka@example.com", type: "email" },
            { id: "phone", label: "Numer telefonu", value: "+48 553 068 994" }
          ],
          actionLabel: null,
          orderIndex: 0
        },
        {
          id: "address",
          title: "Adres",
          description: "Twój adres wykorzystujemy jedynie do realizacji usługi.",
          fields: [
            { id: "street", label: "Ulica", value: "Floriańska 48" },
            { id: "apartment", label: "Numer mieszkania", value: "16" },
            { id: "city", label: "Miasto", value: "Warszawa" },
            { id: "postalCode", label: "Kod pocztowy", value: "03-707" }
          ],
          actionLabel: null,
          orderIndex: 1
        },
        {
          id: "password",
          title: "Zmień hasło",
          description: "Uaktualnij swoje hasło bezpieczeństwa.",
          fields: [
            { id: "newPassword", label: "Nowe hasło", value: "••••••••", type: "password" },
            { id: "confirmPassword", label: "Potwierdź hasło", value: "••••••••", type: "password" }
          ],
          actionLabel: "Zmień hasło",
          orderIndex: 2
        }
      ]);
    }

    if ((await this.notificationsRepository.count()) === 0) {
      await this.notificationsRepository.save([
        { id: "email", title: "Powiadomienia e-mail", description: "Otrzymuj e-maile o zmianach statusu zamówienia.", enabled: true, orderIndex: 0 },
        { id: "sms", title: "Powiadomienia SMS", description: "Otrzymuj SMS-y o ważnych zdarzeniach.", enabled: true, orderIndex: 1 }
      ]);
    }

    if ((await this.externalConnectionsRepository.count()) > 0) {
      return;
    }

    await this.externalConnectionsRepository.save([
      { id: "google", provider: "Połącz konto z Google", icon: "G", orderIndex: 0 },
      { id: "facebook", provider: "Połącz konto z Facebook", icon: "f", orderIndex: 1 },
      { id: "apple", provider: "Połącz konto z Apple", icon: "●", orderIndex: 2 }
    ]);
  }

  private async seedBoard() {
    if ((await this.boardSearchFieldsRepository.count()) === 0) {
      await this.boardSearchFieldsRepository.save([
        { id: "service", label: "Rodzaj usługi", value: "Sprzątanie obiektów · Mieszkań i domów", orderIndex: 0 },
        { id: "area", label: "Powierzchnia", value: "60m²", orderIndex: 1 },
        { id: "location", label: "Lokalizacja", value: "Floriańska 48, Warszawa, Polska", orderIndex: 2 }
      ]);
    }

    if ((await this.boardFiltersRepository.count()) === 0) {
      await this.boardFiltersRepository.save([
        { id: "rating", title: "Ocena", options: ["5", "4", "3", "2", "1"], orderIndex: 0 },
        { id: "price", title: "Cena", options: ["od", "do"], orderIndex: 1 },
        { id: "type", title: "Typ zlecenia", options: ["Jednosesyjne", "Wielosesyjne"], orderIndex: 2 },
        { id: "facilities", title: "Ułatwienia przy zamówieniu", options: ["Bez wymaganych zdjęć lokalu", "Wykonawca zapewnia odkurzacz"], orderIndex: 3 },
        { id: "orders", title: "Min. ilość wykonanych zleceń", options: ["27", "166"], orderIndex: 4 }
      ]);
    }

    if ((await this.boardListingsRepository.count()) > 0) {
      return;
    }

    await this.boardListingsRepository.save([
      {
        id: "paulina-jagielska",
        provider: "Paulina Jagielska",
        rating: 4.7,
        reviews: 13,
        experience: "2 lata",
        price: "165,00 zł",
        completedOrders: 18,
        mode: "Jednosesyjne",
        modeTone: "gray",
        image: "/figma-assets/board-avatar-paulina.png",
        imageFit: null,
        imageScale: null,
        orderIndex: 0
      },
      {
        id: "stepapp",
        provider: "Stepapp",
        rating: 4.0,
        reviews: 27,
        experience: "5 lata",
        price: "265,76 zł",
        completedOrders: 166,
        mode: "Wielosesyjne",
        modeTone: "blue",
        image: "/figma-assets/board-stepapp-logo.png",
        imageFit: "contain",
        imageScale: "89.28%",
        orderIndex: 1
      },
      {
        id: "mobimop",
        provider: "MobiMop",
        rating: 4.9,
        reviews: 16,
        experience: "",
        price: "217,10 zł",
        completedOrders: 34,
        mode: "Jednosesyjne",
        modeTone: "gray",
        image: "/figma-assets/board-mobimop-logo.png",
        imageFit: "contain",
        imageScale: null,
        orderIndex: 2
      },
      {
        id: "klaudia-tarnowek",
        provider: "Klaudia Tarnówek",
        rating: 5.0,
        reviews: 7,
        experience: "",
        price: "185,48 zł",
        completedOrders: 16,
        mode: "Wielosesyjne",
        modeTone: "blue",
        image: "/figma-assets/board-avatar-klaudia.png",
        imageFit: null,
        imageScale: null,
        orderIndex: 3
      },
      {
        id: "perfect-cleaning",
        provider: "Perfect Cleaning",
        rating: 3.1,
        reviews: 11,
        experience: "4 lata",
        price: "198,32 zł",
        completedOrders: 28,
        mode: "Jednosesyjne",
        modeTone: "gray",
        image: "/figma-assets/board-perfect-logo.png",
        imageFit: "contain",
        imageScale: null,
        orderIndex: 4
      },
      {
        id: "cleanok-pl-1",
        provider: "CleanOk.pl",
        rating: 4.3,
        reviews: 16,
        experience: "2 lata",
        price: "241,53 zł",
        completedOrders: 13,
        mode: "Jednosesyjne",
        modeTone: "gray",
        image: "/figma-assets/board-cleanok-logo.png",
        imageFit: "contain",
        imageScale: null,
        orderIndex: 5
      },
      {
        id: "cleanok-pl-2",
        provider: "CleanOk.pl",
        rating: 3.0,
        reviews: 1,
        experience: "",
        price: "209,26 zł",
        completedOrders: 4,
        mode: "Jednosesyjne",
        modeTone: "gray",
        image: "/figma-assets/board-annax-logo.png",
        imageFit: "contain",
        imageScale: null,
        orderIndex: 6
      },
      {
        id: "maliwna-k",
        provider: "Maliwna K.",
        rating: 3.7,
        reviews: 5,
        experience: "1 rok",
        price: "187,86 zł",
        completedOrders: 11,
        mode: "Wielosesyjne",
        modeTone: "blue",
        image: "/figma-assets/board-avatar-maliwna.png",
        imageFit: null,
        imageScale: null,
        orderIndex: 7
      },
      {
        id: "anna-kowal",
        provider: "Anna Kowal",
        rating: 4.8,
        reviews: 31,
        experience: "6 lat",
        price: "176,40 zł",
        completedOrders: 73,
        mode: "Jednosesyjne",
        modeTone: "gray",
        image: "/figma-assets/board-avatar-paulina.png",
        imageFit: null,
        imageScale: null,
        orderIndex: 8
      },
      {
        id: "dom-clean",
        provider: "Dom Clean",
        rating: 4.6,
        reviews: 19,
        experience: "3 lata",
        price: "224,90 zł",
        completedOrders: 52,
        mode: "Wielosesyjne",
        modeTone: "blue",
        image: "/figma-assets/board-mobimop-logo.png",
        imageFit: "contain",
        imageScale: null,
        orderIndex: 9
      }
    ]);
  }

  private async seedProviderProfiles() {
    const providerProfiles: ProviderProfile[] = [
      {
        id: "paulina-jagielska",
        provider: "Paulina Jagielska",
        verified: true,
        service: "Sprzątanie obiektów · Mieszkań i domów",
        location: "Warszawa, Floriańska 48/16",
        rating: 5.0,
        reviewsCount: 42,
        experience: "3 lata",
        completedOrders: 87,
        priceFrom: "od 148 zł",
        tags: ["Jednosesyjne", "Odkurzacz", "Mycie okien", "Piekarnik"],
        description:
          "Dokładne sprzątanie mieszkań i domów z dbałością o szczegóły. Pracuję samodzielnie, punktualnie i zawsze ustalam zakres prac przed realizacją usługi.",
        metrics: [
          { id: "rating", label: "Średnia ocena", value: "5.0" },
          { id: "orders", label: "Wykonane usługi", value: "87" },
          { id: "experience", label: "Doświadczenie", value: "3 lata" },
          { id: "location", label: "Obsługiwany obszar", value: "Warszawa" }
        ],
        gallery: [
          { id: "salon", label: "Salon po sprzątaniu", gradient: "from-[#c9b9a3] to-[#f3e3ce]" },
          { id: "kuchnia", label: "Kuchnia po sprzątaniu", gradient: "from-[#c7d0cf] to-[#8d9b93]" },
          { id: "lazienka", label: "Łazienka po sprzątaniu", gradient: "from-[#dbe8f6] to-[#aabbd0]" }
        ],
        overview: [
          { id: "rating", label: "Ocena", value: "5.0" },
          { id: "reviews", label: "Opinie", value: "42" },
          { id: "orders", label: "Wykonane usługi", value: "87" },
          { id: "experience", label: "Doświadczenie", value: "3 lata" }
        ],
        photos: [
          { id: "living-room", label: "Salon po sprzątaniu", gradient: "linear-gradient(135deg, #c9b9a3 0%, #f3e3ce 100%)" },
          { id: "kitchen", label: "Kuchnia po sprzątaniu", gradient: "linear-gradient(135deg, #c7d0cf 0%, #8d9b93 100%)" },
          { id: "bathroom", label: "Łazienka po sprzątaniu", gradient: "linear-gradient(135deg, #dbe8f6 0%, #aabbd0 100%)" },
          { id: "hall", label: "Przedpokój po sprzątaniu", gradient: "linear-gradient(135deg, #f2ded2 0%, #b8c7d6 100%)" },
          { id: "bedroom", label: "Sypialnia po sprzątaniu", gradient: "linear-gradient(135deg, #dad7cb 0%, #fff6e8 100%)" },
          { id: "details", label: "Detale po realizacji", gradient: "linear-gradient(135deg, #ccd8df 0%, #f7f9fc 100%)" }
        ],
        pricing: [
          {
            id: "single-62",
            label: "Jednorazowe sprzątanie mieszkania 62m²",
            description: "Zakres podstawowy z dojazdem do lokalizacji.",
            price: "165 zł",
            priceValue: 165,
            duration: "3 godziny 15 minut"
          },
          {
            id: "single-80",
            label: "Jednorazowe sprzątanie mieszkania 80m²",
            description: "Zakres podstawowy dla większego mieszkania.",
            price: "214 zł",
            priceValue: 214,
            duration: "4 godziny"
          }
        ],
        frequencies: [
          { id: "once", label: "Jednorazowo", description: "Pojedyncza realizacja bez stałego harmonogramu.", discount: "0%" },
          { id: "weekly", label: "Co tydzień", description: "Stały termin i powtarzalny zakres sprzątania.", discount: "-8%" },
          { id: "biweekly", label: "Co 2 tygodnie", description: "Regularne sprzątanie w wygodnym rytmie.", discount: "-5%" }
        ],
        addOns: [
          {
            id: "oven-cleaning",
            label: "Mycie piekarnika",
            description: "Dokładne czyszczenie wnętrza i szyby piekarnika.",
            price: "24 zł",
            priceValue: 24,
            durationMinutes: 25,
            selected: true
          },
          {
            id: "window-cleaning",
            label: "Mycie okien (4 szt.)",
            description: "Mycie szyb, ram i parapetów w ramach wskazanej liczby okien.",
            price: "48 zł",
            priceValue: 48,
            durationMinutes: 40,
            selected: true
          },
          {
            id: "fridge-cleaning",
            label: "Czyszczenie lodówki",
            description: "Umycie półek, szuflad i wnętrza lodówki.",
            price: "32 zł",
            priceValue: 32,
            durationMinutes: 25
          },
          {
            id: "cabinet-inside",
            label: "Sprzątanie wnętrza szafek",
            description: "Opróżnienie, przetarcie i uporządkowanie wnętrza szafek.",
            price: "36 zł",
            priceValue: 36,
            durationMinutes: 30
          },
          {
            id: "microwave",
            label: "Mycie mikrofalówki",
            description: "Czyszczenie wnętrza, talerza i zewnętrznej obudowy.",
            price: "18 zł",
            priceValue: 18,
            durationMinutes: 15
          }
        ],
        reviews: [
          {
            id: "michal",
            author: "Michał T.",
            rating: 5,
            date: "2 tyg. temu",
            content: "Paulina wykonała wyjątkową pracę, sprzątając nasze trzypokojowe mieszkanie. Była punktualna i dokładna."
          },
          {
            id: "izabela",
            author: "Izabela N.",
            rating: 5,
            date: "7 tyg. temu",
            content: "Mieszkanie po sprzątaniu wyglądało jak nowe, a jej sumienność naprawdę robi wrażenie."
          },
          {
            id: "agata",
            author: "Agata R.",
            rating: 5,
            date: "2 mies. temu",
            content: "Bardzo dobra organizacja pracy, świetny kontakt i dokładnie wykonane mycie okien."
          },
          {
            id: "karol",
            author: "Karol S.",
            rating: 4,
            date: "3 mies. temu",
            content: "Usługa wykonana sprawnie, zgodnie z ustalonym zakresem. Chętnie zamówię ponownie."
          },
          {
            id: "natalia",
            author: "Natalia W.",
            rating: 5,
            date: "4 mies. temu",
            content: "Pani Paulina zadbała o detale w kuchni i łazience. Wszystko było gotowe na czas."
          }
        ],
        standards: [
          "Wykonawca potwierdza zakres usługi przed rozpoczęciem pracy.",
          "Możliwość realizacji usługi z własnym odkurzaczem.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji.",
          "Zdjęcia lokalu nie są wymagane przy tym typie zamówienia."
        ],
        summary: {
          duration: "3 godziny 15 minut",
          lines: [
            { id: "area", label: "Powierzchnia (62m²)", value: "93 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "0 zł" }
          ],
          total: "93 zł"
        }
      },
      {
        id: "stepapp",
        provider: "Stepapp",
        verified: true,
        service: "Sprzątanie obiektów · Biur i lokali użytkowych",
        location: "Warszawa, Wilcza 31",
        rating: 4.0,
        reviewsCount: 27,
        experience: "5 lat",
        completedOrders: 166,
        priceFrom: "od 246 zł",
        tags: ["Wielosesyjne", "Zespół sprzątający", "Własny sprzęt", "Biura"],
        description:
          "Zespół Stepapp realizuje regularne sprzątanie biur, lokali usługowych i wspólnych przestrzeni. Pracujemy według checklisty, zapewniamy własny sprzęt i możemy obsłużyć stały harmonogram poza godzinami pracy biura.",
        metrics: [
          { id: "rating", label: "Średnia ocena", value: "4.0" },
          { id: "orders", label: "Wykonane usługi", value: "166" },
          { id: "experience", label: "Doświadczenie", value: "5 lat" },
          { id: "location", label: "Obsługiwany obszar", value: "Warszawa" }
        ],
        gallery: [
          { id: "open-space", label: "Open space po sprzątaniu", gradient: "from-[#d7e6f3] to-[#f7fbff]" },
          { id: "conference-room", label: "Sala konferencyjna po realizacji", gradient: "from-[#d9dee9] to-[#a9bacb]" },
          { id: "office-kitchen", label: "Aneks kuchenny po sprzątaniu", gradient: "from-[#e6f1dc] to-[#b7cfaa]" }
        ],
        overview: [
          { id: "rating", label: "Ocena", value: "4.0" },
          { id: "reviews", label: "Opinie", value: "27" },
          { id: "orders", label: "Wykonane usługi", value: "166" },
          { id: "experience", label: "Doświadczenie", value: "5 lat" }
        ],
        photos: [
          { id: "open-space", label: "Open space po sprzątaniu", gradient: "linear-gradient(135deg, #d7e6f3 0%, #f7fbff 100%)" },
          { id: "conference-room", label: "Sala konferencyjna po realizacji", gradient: "linear-gradient(135deg, #d9dee9 0%, #a9bacb 100%)" },
          { id: "reception", label: "Recepcja po sprzątaniu", gradient: "linear-gradient(135deg, #f1e6d5 0%, #c9b99c 100%)" },
          { id: "office-kitchen", label: "Aneks kuchenny po sprzątaniu", gradient: "linear-gradient(135deg, #e6f1dc 0%, #b7cfaa 100%)" },
          { id: "desks", label: "Stanowiska pracy po realizacji", gradient: "linear-gradient(135deg, #cfd8e3 0%, #eef3f8 100%)" },
          { id: "sanitary-zone", label: "Zaplecze sanitarne po sprzątaniu", gradient: "linear-gradient(135deg, #dcebf3 0%, #b8cedb 100%)" }
        ],
        pricing: [
          {
            id: "office-90",
            label: "Jednorazowe sprzątanie biura 90m²",
            description: "Zakres podstawowy dla biura z aneksem i salą spotkań.",
            price: "246 zł",
            priceValue: 246,
            duration: "4 godziny 30 minut"
          },
          {
            id: "office-140",
            label: "Jednorazowe sprzątanie biura 140m²",
            description: "Rozszerzony zakres dla większej powierzchni użytkowej.",
            price: "382 zł",
            priceValue: 382,
            duration: "6 godzin"
          }
        ],
        frequencies: [
          { id: "once", label: "Jednorazowo", description: "Pojedyncza realizacja bez stałego harmonogramu.", discount: "0%" },
          { id: "weekly", label: "Co tydzień", description: "Stały termin i powtarzalny zakres sprzątania biura.", discount: "-10%" },
          { id: "twice-weekly", label: "2 razy w tygodniu", description: "Częstsza obsługa dla intensywnie używanych przestrzeni.", discount: "-14%" }
        ],
        addOns: [
          {
            id: "window-cleaning",
            label: "Mycie okien (6 szt.)",
            description: "Mycie szyb, ram i parapetów w lokalu usługowym.",
            price: "72 zł",
            priceValue: 72,
            durationMinutes: 55,
            selected: true
          },
          {
            id: "dishes",
            label: "Zmywanie naczyń",
            description: "Uporządkowanie naczyń i blatu w aneksie kuchennym.",
            price: "28 zł",
            priceValue: 28,
            durationMinutes: 20
          },
          {
            id: "cabinet-inside",
            label: "Sprzątanie wnętrza szafek",
            description: "Przetarcie i uporządkowanie szafek w części kuchennej.",
            price: "42 zł",
            priceValue: 42,
            durationMinutes: 35
          },
          {
            id: "microwave",
            label: "Mycie mikrofalówki",
            description: "Czyszczenie wnętrza, talerza i zewnętrznej obudowy.",
            price: "20 zł",
            priceValue: 20,
            durationMinutes: 15
          },
          {
            id: "fridge-cleaning",
            label: "Czyszczenie lodówki",
            description: "Umycie półek, szuflad i wnętrza lodówki biurowej.",
            price: "36 zł",
            priceValue: 36,
            durationMinutes: 25
          }
        ],
        reviews: [
          {
            id: "martyna",
            author: "Martyna P.",
            rating: 4,
            date: "1 tydz. temu",
            content: "Zespół sprawnie ogarnął biuro po intensywnym tygodniu pracy. Bardzo dobry kontakt i jasne ustalenia."
          },
          {
            id: "rafal",
            author: "Rafał K.",
            rating: 4,
            date: "4 tyg. temu",
            content: "Sprzątanie wykonane zgodnie z checklistą. Szczególnie dobrze przygotowana kuchnia i sala konferencyjna."
          },
          {
            id: "monika",
            author: "Monika S.",
            rating: 5,
            date: "2 mies. temu",
            content: "Doceniam punktualność i możliwość realizacji po godzinach pracy biura. Zamówimy ponownie."
          },
          {
            id: "tomasz",
            author: "Tomasz W.",
            rating: 4,
            date: "3 mies. temu",
            content: "Dobry standard usługi, własny sprzęt i szybkie potwierdzenie zakresu przed startem."
          },
          {
            id: "ewa",
            author: "Ewa L.",
            rating: 3,
            date: "5 mies. temu",
            content: "Realizacja przebiegła poprawnie, a drobne uwagi do recepcji zostały od razu poprawione."
          }
        ],
        standards: [
          "Zespół potwierdza checklistę przed rozpoczęciem pracy.",
          "Wykonawca zapewnia własny sprzęt i podstawowe środki czystości.",
          "Możliwa realizacja poza standardowymi godzinami pracy biura.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji."
        ],
        summary: {
          duration: "4 godziny 30 minut",
          lines: [
            { id: "area", label: "Powierzchnia (90m²)", value: "216 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "30 zł" }
          ],
          total: "246 zł"
        }
      },
      {
        id: "mobimop",
        provider: "MobiMop",
        verified: true,
        service: "Sprzątanie obiektów · Mieszkań i domów",
        location: "Warszawa, Praga-Południe",
        rating: 4.9,
        reviewsCount: 16,
        experience: "2 lata",
        completedOrders: 34,
        priceFrom: "od 198 zł",
        tags: ["Jednosesyjne", "Ekologiczne środki", "Mycie okien", "Bez zdjęć lokalu"],
        description:
          "MobiMop specjalizuje się w jednorazowym sprzątaniu mieszkań po przeprowadzkach, wynajmie krótkoterminowym i większych porządkach domowych. Przed realizacją potwierdzamy priorytety, a po zakończeniu przekazujemy krótkie podsumowanie wykonanych prac.",
        metrics: [
          { id: "rating", label: "Średnia ocena", value: "4.9" },
          { id: "orders", label: "Wykonane usługi", value: "34" },
          { id: "experience", label: "Doświadczenie", value: "2 lata" },
          { id: "location", label: "Obsługiwany obszar", value: "Warszawa" }
        ],
        gallery: [
          { id: "living-room", label: "Salon po sprzątaniu", gradient: "from-[#cfe7df] to-[#f6fbf7]" },
          { id: "kitchen", label: "Kuchnia po sprzątaniu", gradient: "from-[#f2dfca] to-[#fff4e5]" },
          { id: "bathroom", label: "Łazienka po sprzątaniu", gradient: "from-[#d9eaf5] to-[#b7cad8]" }
        ],
        overview: [
          { id: "rating", label: "Ocena", value: "4.9" },
          { id: "reviews", label: "Opinie", value: "16" },
          { id: "orders", label: "Wykonane usługi", value: "34" },
          { id: "experience", label: "Doświadczenie", value: "2 lata" }
        ],
        photos: [
          { id: "living-room", label: "Salon po sprzątaniu", gradient: "linear-gradient(135deg, #cfe7df 0%, #f6fbf7 100%)" },
          { id: "kitchen", label: "Kuchnia po sprzątaniu", gradient: "linear-gradient(135deg, #f2dfca 0%, #fff4e5 100%)" },
          { id: "bathroom", label: "Łazienka po sprzątaniu", gradient: "linear-gradient(135deg, #d9eaf5 0%, #b7cad8 100%)" },
          { id: "hall", label: "Przedpokój po sprzątaniu", gradient: "linear-gradient(135deg, #e4e8ef 0%, #c4d0dd 100%)" },
          { id: "bedroom", label: "Sypialnia po sprzątaniu", gradient: "linear-gradient(135deg, #e8ddd2 0%, #fbf4ec 100%)" },
          { id: "details", label: "Detale po realizacji", gradient: "linear-gradient(135deg, #d5e2dc 0%, #f8fbfa 100%)" }
        ],
        pricing: [
          {
            id: "single-70",
            label: "Jednorazowe sprzątanie mieszkania 70m²",
            description: "Zakres podstawowy z ekologicznymi środkami czystości.",
            price: "198 zł",
            priceValue: 198,
            duration: "3 godziny 45 minut"
          },
          {
            id: "single-95",
            label: "Jednorazowe sprzątanie mieszkania 95m²",
            description: "Zakres rozszerzony dla większego mieszkania lub domu.",
            price: "268 zł",
            priceValue: 268,
            duration: "5 godzin"
          }
        ],
        frequencies: [
          { id: "once", label: "Jednorazowo", description: "Pojedyncza realizacja bez stałego harmonogramu.", discount: "0%" },
          { id: "weekly", label: "Co tydzień", description: "Stały termin dla mieszkania lub domu.", discount: "-7%" },
          { id: "monthly", label: "Co miesiąc", description: "Regularne większe porządki raz w miesiącu.", discount: "-4%" }
        ],
        addOns: [
          {
            id: "window-cleaning",
            label: "Mycie okien (5 szt.)",
            description: "Mycie szyb, ram i parapetów w mieszkaniu.",
            price: "60 zł",
            priceValue: 60,
            durationMinutes: 45,
            selected: true
          },
          {
            id: "oven-cleaning",
            label: "Mycie piekarnika",
            description: "Dokładne czyszczenie wnętrza i szyby piekarnika.",
            price: "26 zł",
            priceValue: 26,
            durationMinutes: 25
          },
          {
            id: "fridge-cleaning",
            label: "Czyszczenie lodówki",
            description: "Umycie półek, szuflad i wnętrza lodówki.",
            price: "34 zł",
            priceValue: 34,
            durationMinutes: 25
          },
          {
            id: "wardrobe",
            label: "Porządkowanie szafy",
            description: "Ułożenie rzeczy i przetarcie półek w wybranej szafie.",
            price: "38 zł",
            priceValue: 38,
            durationMinutes: 30
          },
          {
            id: "litter-box",
            label: "Czyszczenie kuwety",
            description: "Umycie kuwety i uporządkowanie miejsca dla zwierzęcia.",
            price: "16 zł",
            priceValue: 16,
            durationMinutes: 15
          }
        ],
        reviews: [
          {
            id: "aleksandra",
            author: "Aleksandra M.",
            rating: 5,
            date: "5 dni temu",
            content: "Mieszkanie po przeprowadzce było gotowe do odbioru. Bardzo dokładnie posprzątana kuchnia i łazienka."
          },
          {
            id: "piotr",
            author: "Piotr C.",
            rating: 5,
            date: "3 tyg. temu",
            content: "Świetny kontakt przed usługą i szybkie potwierdzenie priorytetów. Wszystko wykonane na czas."
          },
          {
            id: "anna",
            author: "Anna D.",
            rating: 5,
            date: "6 tyg. temu",
            content: "Duży plus za ekologiczne środki i dokładne mycie okien. Efekt był bardzo dobry."
          },
          {
            id: "lukasz",
            author: "Łukasz B.",
            rating: 4,
            date: "2 mies. temu",
            content: "Sprawna realizacja i przyjemny kontakt. Zakres wykonany zgodnie z zamówieniem."
          },
          {
            id: "kinga",
            author: "Kinga R.",
            rating: 5,
            date: "4 mies. temu",
            content: "MobiMop poradził sobie z większym sprzątaniem po remoncie. Chętnie skorzystam ponownie."
          }
        ],
        standards: [
          "Wykonawca potwierdza priorytety przed rozpoczęciem sprzątania.",
          "Możliwość pracy na ekologicznych środkach czystości.",
          "Zdjęcia lokalu nie są wymagane przy tym typie zamówienia.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji."
        ],
        summary: {
          duration: "3 godziny 45 minut",
          lines: [
            { id: "area", label: "Powierzchnia (70m²)", value: "178 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "20 zł" }
          ],
          total: "198 zł"
        }
      },
      createSeedProviderProfile({
        id: "klaudia-tarnowek",
        provider: "Klaudia Tarnówek",
        service: "Sprzątanie obiektów · Mieszkań i domów",
        location: "Warszawa, Targówek",
        rating: 5.0,
        reviewsCount: 7,
        experience: "2 lata",
        completedOrders: 16,
        priceFrom: "od 185 zł",
        tags: ["Wielosesyjne", "Stały harmonogram", "Odkurzacz", "Mycie łazienek"],
        description:
          "Klaudia realizuje regularne sprzątanie mieszkań i domów w stałych terminach. Najlepiej sprawdza się przy powtarzalnych zleceniach, gdzie ważna jest punktualność, spokojny kontakt i dokładnie ustalony zakres prac.",
        photos: [
          {
            id: "living-room",
            label: "Salon po regularnym sprzątaniu",
            galleryGradient: "from-[#ead6c8] to-[#fff4ec]",
            photoGradient: "linear-gradient(135deg, #ead6c8 0%, #fff4ec 100%)"
          },
          {
            id: "bathroom",
            label: "Łazienka po realizacji",
            galleryGradient: "from-[#d7e8f6] to-[#b5cce0]",
            photoGradient: "linear-gradient(135deg, #d7e8f6 0%, #b5cce0 100%)"
          },
          {
            id: "kitchen",
            label: "Kuchnia po sprzątaniu",
            galleryGradient: "from-[#d8e5d0] to-[#f7fbf2]",
            photoGradient: "linear-gradient(135deg, #d8e5d0 0%, #f7fbf2 100%)"
          },
          {
            id: "hall",
            label: "Przedpokój po sprzątaniu",
            galleryGradient: "from-[#e7e3dc] to-[#c7d1dd]",
            photoGradient: "linear-gradient(135deg, #e7e3dc 0%, #c7d1dd 100%)"
          },
          {
            id: "bedroom",
            label: "Sypialnia po realizacji",
            galleryGradient: "from-[#f1dfd8] to-[#fff8f2]",
            photoGradient: "linear-gradient(135deg, #f1dfd8 0%, #fff8f2 100%)"
          },
          {
            id: "details",
            label: "Detale po regularnej usłudze",
            galleryGradient: "from-[#dfe8ef] to-[#f8fbff]",
            photoGradient: "linear-gradient(135deg, #dfe8ef 0%, #f8fbff 100%)"
          }
        ],
        pricing: [
          {
            id: "home-60",
            label: "Regularne sprzątanie mieszkania 60m²",
            description: "Powtarzalny zakres z utrzymaniem kuchni i łazienki.",
            price: "185 zł",
            priceValue: 185,
            duration: "3 godziny 30 minut"
          },
          {
            id: "home-85",
            label: "Regularne sprzątanie mieszkania 85m²",
            description: "Zakres dla większego mieszkania w stałym terminie.",
            price: "238 zł",
            priceValue: 238,
            duration: "4 godziny 30 minut"
          }
        ],
        frequencies: [
          { id: "weekly", label: "Co tydzień", description: "Stały termin i powtarzalny zakres sprzątania.", discount: "-9%" },
          { id: "biweekly", label: "Co 2 tygodnie", description: "Regularne sprzątanie w wygodnym rytmie.", discount: "-6%" },
          { id: "monthly", label: "Co miesiąc", description: "Większe porządki raz w miesiącu.", discount: "-3%" }
        ],
        addOns: [
          {
            id: "window-cleaning",
            label: "Mycie okien (4 szt.)",
            description: "Mycie szyb, ram i parapetów.",
            price: "50 zł",
            priceValue: 50,
            durationMinutes: 40,
            selected: true
          },
          {
            id: "oven-cleaning",
            label: "Mycie piekarnika",
            description: "Czyszczenie wnętrza i szyby piekarnika.",
            price: "25 zł",
            priceValue: 25,
            durationMinutes: 25
          },
          {
            id: "cabinet-inside",
            label: "Sprzątanie wnętrza szafek",
            description: "Przetarcie i uporządkowanie wnętrza szafek.",
            price: "34 zł",
            priceValue: 34,
            durationMinutes: 30
          },
          {
            id: "fridge-cleaning",
            label: "Czyszczenie lodówki",
            description: "Umycie półek, szuflad i wnętrza lodówki.",
            price: "30 zł",
            priceValue: 30,
            durationMinutes: 25
          }
        ],
        reviews: [
          { id: "barbara", author: "Barbara K.", rating: 5, date: "1 tydz. temu", content: "Bardzo dokładna realizacja i świetny kontakt przy ustalaniu stałego terminu." },
          { id: "jan", author: "Jan P.", rating: 5, date: "3 tyg. temu", content: "Mieszkanie było gotowe przed czasem, kuchnia i łazienka bez zastrzeżeń." },
          { id: "marta", author: "Marta S.", rating: 5, date: "2 mies. temu", content: "Klaudia dobrze trzyma się ustalonego zakresu i jest bardzo punktualna." }
        ],
        standards: [
          "Wykonawca potwierdza zakres usługi przed rozpoczęciem pracy.",
          "Możliwość ustawienia stałego harmonogramu realizacji.",
          "Zdjęcia lokalu nie są wymagane przy tym typie zamówienia.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji."
        ],
        summary: {
          duration: "3 godziny 30 minut",
          lines: [
            { id: "area", label: "Powierzchnia (60m²)", value: "165 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "20 zł" }
          ],
          total: "185 zł"
        }
      }),
      createSeedProviderProfile({
        id: "perfect-cleaning",
        provider: "Perfect Cleaning",
        service: "Sprzątanie obiektów · Mieszkań i domów",
        location: "Warszawa, Mokotów",
        rating: 3.1,
        reviewsCount: 11,
        experience: "4 lata",
        completedOrders: 28,
        priceFrom: "od 198 zł",
        tags: ["Jednosesyjne", "Własny sprzęt", "Prasowanie", "Okap"],
        description:
          "Perfect Cleaning obsługuje jednorazowe sprzątanie mieszkań, szczególnie po wynajmie lub dłuższej przerwie w porządkach. Zespół zapewnia własny sprzęt i może rozszerzyć zakres o prasowanie oraz czyszczenie sprzętów kuchennych.",
        photos: [
          {
            id: "living-room",
            label: "Salon po sprzątaniu",
            galleryGradient: "from-[#d8dde7] to-[#f7f9fd]",
            photoGradient: "linear-gradient(135deg, #d8dde7 0%, #f7f9fd 100%)"
          },
          {
            id: "kitchen",
            label: "Kuchnia po czyszczeniu",
            galleryGradient: "from-[#eed7be] to-[#fff1df]",
            photoGradient: "linear-gradient(135deg, #eed7be 0%, #fff1df 100%)"
          },
          {
            id: "wardrobe",
            label: "Strefa po prasowaniu",
            galleryGradient: "from-[#ddd6ec] to-[#faf7ff]",
            photoGradient: "linear-gradient(135deg, #ddd6ec 0%, #faf7ff 100%)"
          },
          {
            id: "bathroom",
            label: "Łazienka po realizacji",
            galleryGradient: "from-[#d5e8f0] to-[#f6fbfd]",
            photoGradient: "linear-gradient(135deg, #d5e8f0 0%, #f6fbfd 100%)"
          },
          {
            id: "hall",
            label: "Przedpokój po sprzątaniu",
            galleryGradient: "from-[#e4ded4] to-[#c8d3de]",
            photoGradient: "linear-gradient(135deg, #e4ded4 0%, #c8d3de 100%)"
          },
          {
            id: "details",
            label: "Detale po usłudze",
            galleryGradient: "from-[#e7ecef] to-[#ffffff]",
            photoGradient: "linear-gradient(135deg, #e7ecef 0%, #ffffff 100%)"
          }
        ],
        pricing: [
          {
            id: "single-65",
            label: "Jednorazowe sprzątanie mieszkania 65m²",
            description: "Zakres podstawowy z własnym sprzętem.",
            price: "198 zł",
            priceValue: 198,
            duration: "3 godziny 40 minut"
          },
          {
            id: "single-90",
            label: "Jednorazowe sprzątanie mieszkania 90m²",
            description: "Rozszerzony zakres dla większej powierzchni.",
            price: "259 zł",
            priceValue: 259,
            duration: "5 godzin"
          }
        ],
        frequencies: [
          { id: "once", label: "Jednorazowo", description: "Pojedyncza realizacja bez stałego harmonogramu.", discount: "0%" },
          { id: "biweekly", label: "Co 2 tygodnie", description: "Regularny zakres dla mieszkań prywatnych.", discount: "-5%" },
          { id: "monthly", label: "Co miesiąc", description: "Okresowe większe porządki.", discount: "-3%" }
        ],
        addOns: [
          {
            id: "ironing",
            label: "Prasowanie",
            description: "Prasowanie przygotowanej odzieży lub tekstyliów domowych.",
            price: "40 zł",
            priceValue: 40,
            durationMinutes: 45,
            selected: true
          },
          {
            id: "hood-cleaning",
            label: "Mycie okapu",
            description: "Czyszczenie zewnętrznych elementów okapu.",
            price: "30 zł",
            priceValue: 30,
            durationMinutes: 25
          },
          {
            id: "microwave",
            label: "Mycie mikrofalówki",
            description: "Czyszczenie wnętrza, talerza i obudowy.",
            price: "18 zł",
            priceValue: 18,
            durationMinutes: 15
          },
          {
            id: "window-cleaning",
            label: "Mycie okien (3 szt.)",
            description: "Mycie szyb, ram i parapetów.",
            price: "42 zł",
            priceValue: 42,
            durationMinutes: 35
          }
        ],
        reviews: [
          { id: "olga", author: "Olga N.", rating: 4, date: "2 tyg. temu", content: "Sprzątanie wykonane poprawnie, bardzo dobrze wyszła kuchnia." },
          { id: "marek", author: "Marek T.", rating: 3, date: "6 tyg. temu", content: "Zakres podstawowy wykonany zgodnie z zamówieniem, kontakt był sprawny." },
          { id: "patrycja", author: "Patrycja L.", rating: 3, date: "3 mies. temu", content: "Usługa w porządku, największy plus za własny sprzęt i szybki termin." }
        ],
        standards: [
          "Wykonawca potwierdza zakres usługi przed rozpoczęciem pracy.",
          "Wykonawca zapewnia własny sprzęt do realizacji.",
          "Możliwość dodania prasowania i czyszczenia sprzętów kuchennych.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji."
        ],
        summary: {
          duration: "3 godziny 40 minut",
          lines: [
            { id: "area", label: "Powierzchnia (65m²)", value: "178 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "20 zł" }
          ],
          total: "198 zł"
        }
      }),
      createSeedProviderProfile({
        id: "cleanok-pl-1",
        provider: "CleanOk.pl",
        service: "Sprzątanie obiektów · Mieszkań i domów",
        location: "Warszawa, Wola",
        rating: 4.3,
        reviewsCount: 16,
        experience: "2 lata",
        completedOrders: 13,
        priceFrom: "od 241 zł",
        tags: ["Jednosesyjne", "Mycie okien", "Lodówka", "Szafki"],
        description:
          "CleanOk.pl realizuje dokładne sprzątanie mieszkań z możliwością rozszerzenia zakresu o kuchnię, lodówkę, szafki i okna. Profil jest przygotowany pod jednorazowe zamówienia, w których ważne są szybkie ustalenia i czytelna wycena.",
        photos: [
          {
            id: "kitchen",
            label: "Kuchnia po sprzątaniu",
            galleryGradient: "from-[#d4e6de] to-[#f7fcf9]",
            photoGradient: "linear-gradient(135deg, #d4e6de 0%, #f7fcf9 100%)"
          },
          {
            id: "fridge",
            label: "Lodówka po czyszczeniu",
            galleryGradient: "from-[#dcebf5] to-[#ffffff]",
            photoGradient: "linear-gradient(135deg, #dcebf5 0%, #ffffff 100%)"
          },
          {
            id: "windows",
            label: "Okna po myciu",
            galleryGradient: "from-[#cfe2f2] to-[#edf8ff]",
            photoGradient: "linear-gradient(135deg, #cfe2f2 0%, #edf8ff 100%)"
          },
          {
            id: "living-room",
            label: "Salon po realizacji",
            galleryGradient: "from-[#e9ddcf] to-[#fff7ec]",
            photoGradient: "linear-gradient(135deg, #e9ddcf 0%, #fff7ec 100%)"
          },
          {
            id: "bathroom",
            label: "Łazienka po sprzątaniu",
            galleryGradient: "from-[#d9e4ea] to-[#f7fbff]",
            photoGradient: "linear-gradient(135deg, #d9e4ea 0%, #f7fbff 100%)"
          },
          {
            id: "details",
            label: "Detale po realizacji",
            galleryGradient: "from-[#dfe8dc] to-[#fbfdf8]",
            photoGradient: "linear-gradient(135deg, #dfe8dc 0%, #fbfdf8 100%)"
          }
        ],
        pricing: [
          {
            id: "single-75",
            label: "Jednorazowe sprzątanie mieszkania 75m²",
            description: "Zakres podstawowy z dojazdem i kuchnią.",
            price: "241 zł",
            priceValue: 241,
            duration: "4 godziny 15 minut"
          },
          {
            id: "single-100",
            label: "Jednorazowe sprzątanie mieszkania 100m²",
            description: "Zakres dla większej powierzchni z dłuższą realizacją.",
            price: "312 zł",
            priceValue: 312,
            duration: "5 godzin 30 minut"
          }
        ],
        frequencies: [
          { id: "once", label: "Jednorazowo", description: "Pojedyncza realizacja bez stałego harmonogramu.", discount: "0%" },
          { id: "weekly", label: "Co tydzień", description: "Stałe utrzymanie mieszkania w czystości.", discount: "-8%" },
          { id: "biweekly", label: "Co 2 tygodnie", description: "Regularny rytm dla średnich mieszkań.", discount: "-5%" }
        ],
        addOns: [
          {
            id: "fridge-cleaning",
            label: "Czyszczenie lodówki",
            description: "Umycie półek, szuflad i wnętrza lodówki.",
            price: "35 zł",
            priceValue: 35,
            durationMinutes: 25,
            selected: true
          },
          {
            id: "cabinet-inside",
            label: "Sprzątanie wnętrza szafek",
            description: "Przetarcie i uporządkowanie szafek kuchennych.",
            price: "38 zł",
            priceValue: 38,
            durationMinutes: 30
          },
          {
            id: "window-cleaning",
            label: "Mycie okien (5 szt.)",
            description: "Mycie szyb, ram i parapetów.",
            price: "60 zł",
            priceValue: 60,
            durationMinutes: 45
          },
          {
            id: "oven-cleaning",
            label: "Mycie piekarnika",
            description: "Dokładne czyszczenie wnętrza piekarnika.",
            price: "26 zł",
            priceValue: 26,
            durationMinutes: 25
          }
        ],
        reviews: [
          { id: "renata", author: "Renata J.", rating: 4, date: "1 tydz. temu", content: "Bardzo dobry kontakt i dokładnie wykonana kuchnia." },
          { id: "adam", author: "Adam W.", rating: 5, date: "1 mies. temu", content: "Usługa wykonana terminowo, lodówka i szafki wyglądały świetnie." },
          { id: "joanna", author: "Joanna M.", rating: 4, date: "2 mies. temu", content: "Sprawna realizacja, jasna wycena i porządek po zakończeniu." }
        ],
        standards: [
          "Wykonawca potwierdza zakres usługi przed rozpoczęciem pracy.",
          "Możliwość rozszerzenia zakresu o kuchnię i okna.",
          "Zdjęcia lokalu nie są wymagane przy tym typie zamówienia.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji."
        ],
        summary: {
          duration: "4 godziny 15 minut",
          lines: [
            { id: "area", label: "Powierzchnia (75m²)", value: "221 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "20 zł" }
          ],
          total: "241 zł"
        }
      }),
      createSeedProviderProfile({
        id: "cleanok-pl-2",
        provider: "CleanOk.pl",
        service: "Sprzątanie obiektów · Mieszkań i domów",
        location: "Warszawa, Ursynów",
        rating: 3.0,
        reviewsCount: 1,
        experience: "6 mies.",
        completedOrders: 4,
        priceFrom: "od 209 zł",
        tags: ["Jednosesyjne", "Podstawowy zakres", "Dojazd", "Mieszkania"],
        description:
          "Drugi profil CleanOk.pl jest przeznaczony do podstawowych, jednorazowych zleceń w mieszkaniach. To prostszy zakres usługi z krótkim czasem realizacji i możliwością dodania pojedynczych prac dodatkowych.",
        photos: [
          {
            id: "studio",
            label: "Mieszkanie po sprzątaniu",
            galleryGradient: "from-[#e3ded7] to-[#fff8ef]",
            photoGradient: "linear-gradient(135deg, #e3ded7 0%, #fff8ef 100%)"
          },
          {
            id: "bathroom",
            label: "Łazienka po podstawowym zakresie",
            galleryGradient: "from-[#d9e7ef] to-[#f8fcff]",
            photoGradient: "linear-gradient(135deg, #d9e7ef 0%, #f8fcff 100%)"
          },
          {
            id: "kitchenette",
            label: "Aneks kuchenny po sprzątaniu",
            galleryGradient: "from-[#e8ead8] to-[#fbfced]",
            photoGradient: "linear-gradient(135deg, #e8ead8 0%, #fbfced 100%)"
          },
          {
            id: "floor",
            label: "Podłogi po realizacji",
            galleryGradient: "from-[#ddd1c3] to-[#f5eadf]",
            photoGradient: "linear-gradient(135deg, #ddd1c3 0%, #f5eadf 100%)"
          },
          {
            id: "hall",
            label: "Przedpokój po usłudze",
            galleryGradient: "from-[#e1e6eb] to-[#f9fbfd]",
            photoGradient: "linear-gradient(135deg, #e1e6eb 0%, #f9fbfd 100%)"
          },
          {
            id: "details",
            label: "Detale po podstawowym sprzątaniu",
            galleryGradient: "from-[#d7e0da] to-[#ffffff]",
            photoGradient: "linear-gradient(135deg, #d7e0da 0%, #ffffff 100%)"
          }
        ],
        pricing: [
          {
            id: "single-55",
            label: "Jednorazowe sprzątanie mieszkania 55m²",
            description: "Podstawowy zakres z dojazdem.",
            price: "209 zł",
            priceValue: 209,
            duration: "3 godziny"
          },
          {
            id: "single-70",
            label: "Jednorazowe sprzątanie mieszkania 70m²",
            description: "Podstawowy zakres dla większej powierzchni.",
            price: "244 zł",
            priceValue: 244,
            duration: "3 godziny 45 minut"
          }
        ],
        frequencies: [
          { id: "once", label: "Jednorazowo", description: "Pojedyncza realizacja bez stałego harmonogramu.", discount: "0%" },
          { id: "monthly", label: "Co miesiąc", description: "Okresowe utrzymanie mieszkania.", discount: "-2%" },
          { id: "custom", label: "Termin indywidualny", description: "Realizacja po uzgodnieniu dostępności.", discount: "0%" }
        ],
        addOns: [
          {
            id: "microwave",
            label: "Mycie mikrofalówki",
            description: "Czyszczenie wnętrza, talerza i obudowy.",
            price: "18 zł",
            priceValue: 18,
            durationMinutes: 15
          },
          {
            id: "dishes",
            label: "Zmywanie naczyń",
            description: "Uporządkowanie naczyń i zlewu.",
            price: "22 zł",
            priceValue: 22,
            durationMinutes: 20
          },
          {
            id: "window-cleaning",
            label: "Mycie okien (2 szt.)",
            description: "Mycie szyb, ram i parapetów.",
            price: "30 zł",
            priceValue: 30,
            durationMinutes: 25
          }
        ],
        reviews: [
          { id: "kamil", author: "Kamil R.", rating: 3, date: "1 mies. temu", content: "Podstawowy zakres wykonany poprawnie, cena była zgodna z ustaleniami." }
        ],
        standards: [
          "Wykonawca potwierdza zakres usługi przed rozpoczęciem pracy.",
          "Zakres podstawowy obejmuje kuchnię, łazienkę i odkurzanie.",
          "Możliwość dodania pojedynczych usług dodatkowych.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji."
        ],
        summary: {
          duration: "3 godziny",
          lines: [
            { id: "area", label: "Powierzchnia (55m²)", value: "189 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "20 zł" }
          ],
          total: "209 zł"
        }
      }),
      createSeedProviderProfile({
        id: "maliwna-k",
        provider: "Maliwna K.",
        service: "Sprzątanie obiektów · Biur i lokali użytkowych",
        location: "Warszawa, Śródmieście",
        rating: 3.7,
        reviewsCount: 5,
        experience: "1 rok",
        completedOrders: 11,
        priceFrom: "od 187 zł",
        tags: ["Wielosesyjne", "Małe biura", "Aneks kuchenny", "Elastyczne godziny"],
        description:
          "Maliwna K. obsługuje małe biura i lokale usługowe w trybie regularnym. Profil sprawdza się przy lżejszych zakresach, utrzymaniu porządku w aneksie kuchennym i sprzątaniu poza godzinami największego ruchu.",
        photos: [
          {
            id: "office",
            label: "Małe biuro po sprzątaniu",
            galleryGradient: "from-[#d6e2ec] to-[#f7fbff]",
            photoGradient: "linear-gradient(135deg, #d6e2ec 0%, #f7fbff 100%)"
          },
          {
            id: "kitchenette",
            label: "Aneks biurowy po realizacji",
            galleryGradient: "from-[#e4eedc] to-[#f9fff5]",
            photoGradient: "linear-gradient(135deg, #e4eedc 0%, #f9fff5 100%)"
          },
          {
            id: "desks",
            label: "Biurka po uporządkowaniu",
            galleryGradient: "from-[#dcd8e8] to-[#fbf9ff]",
            photoGradient: "linear-gradient(135deg, #dcd8e8 0%, #fbf9ff 100%)"
          },
          {
            id: "reception",
            label: "Strefa wejściowa po sprzątaniu",
            galleryGradient: "from-[#eadcca] to-[#fff5e7]",
            photoGradient: "linear-gradient(135deg, #eadcca 0%, #fff5e7 100%)"
          },
          {
            id: "floor",
            label: "Podłogi po realizacji",
            galleryGradient: "from-[#d1dce7] to-[#edf4fa]",
            photoGradient: "linear-gradient(135deg, #d1dce7 0%, #edf4fa 100%)"
          },
          {
            id: "details",
            label: "Detale po usłudze",
            galleryGradient: "from-[#e2e7e2] to-[#ffffff]",
            photoGradient: "linear-gradient(135deg, #e2e7e2 0%, #ffffff 100%)"
          }
        ],
        pricing: [
          {
            id: "office-50",
            label: "Regularne sprzątanie biura 50m²",
            description: "Zakres podstawowy dla małego biura.",
            price: "187 zł",
            priceValue: 187,
            duration: "3 godziny"
          },
          {
            id: "office-75",
            label: "Regularne sprzątanie biura 75m²",
            description: "Zakres dla lokalu z aneksem i zapleczem.",
            price: "236 zł",
            priceValue: 236,
            duration: "4 godziny"
          }
        ],
        frequencies: [
          { id: "weekly", label: "Co tydzień", description: "Stały termin dla biura lub lokalu.", discount: "-7%" },
          { id: "twice-weekly", label: "2 razy w tygodniu", description: "Częstsza obsługa przy większym ruchu.", discount: "-10%" },
          { id: "monthly", label: "Co miesiąc", description: "Okresowe większe porządki.", discount: "-3%" }
        ],
        addOns: [
          {
            id: "dishes",
            label: "Zmywanie naczyń",
            description: "Uporządkowanie naczyń i blatu w aneksie.",
            price: "24 zł",
            priceValue: 24,
            durationMinutes: 20,
            selected: true
          },
          {
            id: "microwave",
            label: "Mycie mikrofalówki",
            description: "Czyszczenie wnętrza i obudowy mikrofalówki.",
            price: "18 zł",
            priceValue: 18,
            durationMinutes: 15
          },
          {
            id: "cabinet-inside",
            label: "Sprzątanie wnętrza szafek",
            description: "Przetarcie wybranych szafek w aneksie.",
            price: "32 zł",
            priceValue: 32,
            durationMinutes: 25
          }
        ],
        reviews: [
          { id: "igor", author: "Igor H.", rating: 4, date: "2 tyg. temu", content: "Dobry kontakt i szybkie sprzątanie małego biura." },
          { id: "karolina", author: "Karolina F.", rating: 4, date: "2 mies. temu", content: "Aneks i toaleta były przygotowane zgodnie z ustaleniami." },
          { id: "filip", author: "Filip Z.", rating: 3, date: "4 mies. temu", content: "Zakres wykonany poprawnie, termin udało się ustalić szybko." }
        ],
        standards: [
          "Wykonawca potwierdza checklistę przed rozpoczęciem pracy.",
          "Możliwa realizacja poza godzinami pracy lokalu.",
          "Zakres może obejmować aneks kuchenny i zaplecze.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji."
        ],
        summary: {
          duration: "3 godziny",
          lines: [
            { id: "area", label: "Powierzchnia (50m²)", value: "167 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "20 zł" }
          ],
          total: "187 zł"
        }
      }),
      createSeedProviderProfile({
        id: "anna-kowal",
        provider: "Anna Kowal",
        service: "Sprzątanie obiektów · Mieszkań i domów",
        location: "Warszawa, Żoliborz",
        rating: 4.8,
        reviewsCount: 31,
        experience: "6 lat",
        completedOrders: 73,
        priceFrom: "od 176 zł",
        tags: ["Jednosesyjne", "Doświadczenie 6 lat", "Mycie okien", "Piekarnik"],
        description:
          "Anna Kowal ma duże doświadczenie w sprzątaniu mieszkań i domów po codziennym użytkowaniu, po wynajmie oraz przed odbiorem lokalu. Pracuje samodzielnie, dokładnie ustala priorytety i chętnie rozszerza zakres o kuchnię oraz okna.",
        photos: [
          {
            id: "living-room",
            label: "Salon po sprzątaniu",
            galleryGradient: "from-[#d8cdbf] to-[#fff3e6]",
            photoGradient: "linear-gradient(135deg, #d8cdbf 0%, #fff3e6 100%)"
          },
          {
            id: "kitchen",
            label: "Kuchnia po realizacji",
            galleryGradient: "from-[#d6e4d1] to-[#f8fff4]",
            photoGradient: "linear-gradient(135deg, #d6e4d1 0%, #f8fff4 100%)"
          },
          {
            id: "bathroom",
            label: "Łazienka po sprzątaniu",
            galleryGradient: "from-[#d4e6f3] to-[#f7fbff]",
            photoGradient: "linear-gradient(135deg, #d4e6f3 0%, #f7fbff 100%)"
          },
          {
            id: "windows",
            label: "Okna po myciu",
            galleryGradient: "from-[#c9dceb] to-[#eff9ff]",
            photoGradient: "linear-gradient(135deg, #c9dceb 0%, #eff9ff 100%)"
          },
          {
            id: "bedroom",
            label: "Sypialnia po realizacji",
            galleryGradient: "from-[#e8d9d2] to-[#fff8f4]",
            photoGradient: "linear-gradient(135deg, #e8d9d2 0%, #fff8f4 100%)"
          },
          {
            id: "details",
            label: "Detale po sprzątaniu",
            galleryGradient: "from-[#dce2e5] to-[#ffffff]",
            photoGradient: "linear-gradient(135deg, #dce2e5 0%, #ffffff 100%)"
          }
        ],
        pricing: [
          {
            id: "single-60",
            label: "Jednorazowe sprzątanie mieszkania 60m²",
            description: "Zakres podstawowy z dojazdem.",
            price: "176 zł",
            priceValue: 176,
            duration: "3 godziny 20 minut"
          },
          {
            id: "single-85",
            label: "Jednorazowe sprzątanie mieszkania 85m²",
            description: "Zakres podstawowy dla większego mieszkania.",
            price: "231 zł",
            priceValue: 231,
            duration: "4 godziny 30 minut"
          }
        ],
        frequencies: [
          { id: "once", label: "Jednorazowo", description: "Pojedyncza realizacja bez stałego harmonogramu.", discount: "0%" },
          { id: "weekly", label: "Co tydzień", description: "Stałe utrzymanie mieszkania w czystości.", discount: "-8%" },
          { id: "biweekly", label: "Co 2 tygodnie", description: "Regularne sprzątanie w spokojnym rytmie.", discount: "-5%" }
        ],
        addOns: [
          {
            id: "oven-cleaning",
            label: "Mycie piekarnika",
            description: "Dokładne czyszczenie wnętrza i szyby piekarnika.",
            price: "24 zł",
            priceValue: 24,
            durationMinutes: 25,
            selected: true
          },
          {
            id: "window-cleaning",
            label: "Mycie okien (4 szt.)",
            description: "Mycie szyb, ram i parapetów.",
            price: "48 zł",
            priceValue: 48,
            durationMinutes: 40
          },
          {
            id: "fridge-cleaning",
            label: "Czyszczenie lodówki",
            description: "Umycie półek, szuflad i wnętrza lodówki.",
            price: "32 zł",
            priceValue: 32,
            durationMinutes: 25
          },
          {
            id: "wardrobe",
            label: "Porządkowanie szafy",
            description: "Ułożenie rzeczy i przetarcie półek w szafie.",
            price: "36 zł",
            priceValue: 36,
            durationMinutes: 30
          }
        ],
        reviews: [
          { id: "malgorzata", author: "Małgorzata D.", rating: 5, date: "4 dni temu", content: "Bardzo dokładna osoba, mieszkanie było świetnie przygotowane po usłudze." },
          { id: "sebastian", author: "Sebastian K.", rating: 5, date: "3 tyg. temu", content: "Świetny kontakt, punktualność i bardzo dobrze wykonane mycie okien." },
          { id: "nina", author: "Nina P.", rating: 4, date: "2 mies. temu", content: "Zakres wykonany zgodnie z ustaleniami, kuchnia wyglądała bardzo dobrze." }
        ],
        standards: [
          "Wykonawca potwierdza zakres usługi przed rozpoczęciem pracy.",
          "Możliwość realizacji usługi z własnym odkurzaczem klienta.",
          "Zdjęcia lokalu nie są wymagane przy tym typie zamówienia.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji."
        ],
        summary: {
          duration: "3 godziny 20 minut",
          lines: [
            { id: "area", label: "Powierzchnia (60m²)", value: "156 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "20 zł" }
          ],
          total: "176 zł"
        }
      }),
      createSeedProviderProfile({
        id: "dom-clean",
        provider: "Dom Clean",
        service: "Sprzątanie obiektów · Biur i lokali użytkowych",
        location: "Warszawa, Ochota",
        rating: 4.6,
        reviewsCount: 19,
        experience: "3 lata",
        completedOrders: 52,
        priceFrom: "od 224 zł",
        tags: ["Wielosesyjne", "Biura", "Własny sprzęt", "Stały zespół"],
        description:
          "Dom Clean realizuje wielosesyjne sprzątanie biur, lokali usługowych i części wspólnych. Zespół pracuje według checklisty, zapewnia własny sprzęt i może obsługiwać stałe terminy rano albo po godzinach pracy.",
        photos: [
          {
            id: "office",
            label: "Biuro po sprzątaniu",
            galleryGradient: "from-[#d7e2ec] to-[#f7fbff]",
            photoGradient: "linear-gradient(135deg, #d7e2ec 0%, #f7fbff 100%)"
          },
          {
            id: "conference",
            label: "Sala spotkań po realizacji",
            galleryGradient: "from-[#dcd8ce] to-[#fff4e3]",
            photoGradient: "linear-gradient(135deg, #dcd8ce 0%, #fff4e3 100%)"
          },
          {
            id: "kitchen",
            label: "Kuchnia biurowa po sprzątaniu",
            galleryGradient: "from-[#dcebd8] to-[#f8fff5]",
            photoGradient: "linear-gradient(135deg, #dcebd8 0%, #f8fff5 100%)"
          },
          {
            id: "reception",
            label: "Recepcja po sprzątaniu",
            galleryGradient: "from-[#e7ded2] to-[#fff7ec]",
            photoGradient: "linear-gradient(135deg, #e7ded2 0%, #fff7ec 100%)"
          },
          {
            id: "sanitary",
            label: "Zaplecze sanitarne po realizacji",
            galleryGradient: "from-[#d7e6ef] to-[#f7fbff]",
            photoGradient: "linear-gradient(135deg, #d7e6ef 0%, #f7fbff 100%)"
          },
          {
            id: "details",
            label: "Detale po usłudze",
            galleryGradient: "from-[#e2e7e9] to-[#ffffff]",
            photoGradient: "linear-gradient(135deg, #e2e7e9 0%, #ffffff 100%)"
          }
        ],
        pricing: [
          {
            id: "office-80",
            label: "Regularne sprzątanie biura 80m²",
            description: "Zakres podstawowy z własnym sprzętem.",
            price: "224 zł",
            priceValue: 224,
            duration: "4 godziny"
          },
          {
            id: "office-120",
            label: "Regularne sprzątanie biura 120m²",
            description: "Rozszerzony zakres dla większej powierzchni.",
            price: "318 zł",
            priceValue: 318,
            duration: "5 godzin 30 minut"
          }
        ],
        frequencies: [
          { id: "weekly", label: "Co tydzień", description: "Stały termin i powtarzalny zakres sprzątania.", discount: "-9%" },
          { id: "twice-weekly", label: "2 razy w tygodniu", description: "Częstsza obsługa dla intensywnie używanych biur.", discount: "-13%" },
          { id: "daily", label: "Codziennie", description: "Stała obsługa w dni robocze po ustaleniu zakresu.", discount: "-16%" }
        ],
        addOns: [
          {
            id: "window-cleaning",
            label: "Mycie okien (6 szt.)",
            description: "Mycie szyb, ram i parapetów w biurze.",
            price: "72 zł",
            priceValue: 72,
            durationMinutes: 55,
            selected: true
          },
          {
            id: "dishes",
            label: "Zmywanie naczyń",
            description: "Uporządkowanie naczyń i blatu w aneksie.",
            price: "28 zł",
            priceValue: 28,
            durationMinutes: 20
          },
          {
            id: "fridge-cleaning",
            label: "Czyszczenie lodówki",
            description: "Umycie półek, szuflad i wnętrza lodówki biurowej.",
            price: "36 zł",
            priceValue: 36,
            durationMinutes: 25
          },
          {
            id: "cabinet-inside",
            label: "Sprzątanie wnętrza szafek",
            description: "Przetarcie szafek w aneksie kuchennym.",
            price: "38 zł",
            priceValue: 38,
            durationMinutes: 30
          }
        ],
        reviews: [
          { id: "justyna", author: "Justyna A.", rating: 5, date: "1 tydz. temu", content: "Bardzo dobry standard regularnej obsługi biura, zespół jest punktualny." },
          { id: "lukasz", author: "Łukasz N.", rating: 4, date: "5 tyg. temu", content: "Kuchnia i sala spotkań po usłudze były przygotowane bez zastrzeżeń." },
          { id: "daria", author: "Daria W.", rating: 5, date: "3 mies. temu", content: "Doceniam własny sprzęt i elastyczne godziny realizacji." }
        ],
        standards: [
          "Zespół potwierdza checklistę przed rozpoczęciem pracy.",
          "Wykonawca zapewnia własny sprzęt i podstawowe środki czystości.",
          "Możliwa realizacja poza standardowymi godzinami pracy biura.",
          "Rozliczenie odbywa się bezpośrednio z wykonawcą po realizacji."
        ],
        summary: {
          duration: "4 godziny",
          lines: [
            { id: "area", label: "Powierzchnia (80m²)", value: "204 zł" },
            { id: "travel", label: "Dojazd do lokalizacji", value: "20 zł" }
          ],
          total: "224 zł"
        }
      })
    ];

    const existingProfiles = await this.providerProfilesRepository.find({ select: ["id"] });
    const existingIds = new Set(existingProfiles.map((profile) => profile.id));
    const missingProfiles = providerProfiles.filter((profile) => !existingIds.has(profile.id));

    if (missingProfiles.length === 0) {
      return;
    }

    await this.providerProfilesRepository.save(missingProfiles);
  }
}
