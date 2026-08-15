export type DashboardOrder = {
  id: string;
  status: string;
  mode: string;
  modeTone?: "blue";
  provider: string;
  details: string;
  address: string;
  logo?: string;
  avatar?: string;
  dateLines: string[];
  range?: boolean;
  actions: string[];
};

export type DashboardPayload = {
  user: {
    name: string;
    phone: string;
    initials: string;
  };
  orders: DashboardOrder[];
  completedOrder: DashboardOrder | null;
};

export type FavoriteProvider = {
  id: string;
  name: string;
  completedServices: number;
  rating: number;
  reviews: number;
  experience: string;
};

export type ReviewImage = {
  id: string;
  label: string;
};

export type PanelReview = {
  id: string;
  person: string;
  service: string;
  author?: string;
  rating?: number;
  date?: string;
  content?: string;
  images?: ReviewImage[];
  avatarTone: "person" | "brand" | "light";
  editable?: boolean;
};

export type PendingReview = {
  id: string;
  person: string;
  service: string;
  avatarTone: "person" | "brand" | "light";
};

export type OpinionsPayload = {
  pendingReviews: PendingReview[];
  userReviews: PanelReview[];
};

export type SettingsField = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
};

export type SettingsSection = {
  id: string;
  title: string;
  description: string;
  fields?: SettingsField[];
  actionLabel?: string;
};

export type NotificationSetting = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type ExternalConnection = {
  id: string;
  provider: string;
  icon: string;
};

export type SettingsPayload = {
  sections: SettingsSection[];
  notifications: NotificationSetting[];
  externalConnections: ExternalConnection[];
};

export type SearchField = {
  id: string;
  label: string;
  value: string;
};

export type FilterGroup = {
  id: string;
  title: string;
  options: string[];
};

export type BoardListing = {
  id: string;
  provider: string;
  rating: number;
  reviews: number;
  experience: string;
  price: string;
  completedOrders: number;
  mode: "Jednosesyjne" | "Wielosesyjne";
  modeTone: "blue" | "gray";
  image: string;
  imageFit?: "cover" | "contain";
  imageScale?: string;
};

export type BoardPayload = {
  searchFields: SearchField[];
  filters: FilterGroup[];
  listings: BoardListing[];
};

export type ProviderProfile = {
  id: string;
  provider: string;
  verified: boolean;
  service: string;
  location: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  completedOrders: number;
  priceFrom: string;
  tags: string[];
  description: string;
  metrics: Array<{ id: string; label: string; value: string }>;
  gallery: Array<{ gradient: string; id: string; label: string }>;
  overview?: Array<{ id: string; label: string; value: string }> | null;
  photos?: Array<{ gradient: string; id: string; image?: string; label: string }> | null;
  pricing?: Array<{ description: string; duration: string; id: string; label: string; price: string; priceValue: number }> | null;
  frequencies?: Array<{ description: string; discount: string; id: string; label: string }> | null;
  addOns?: Array<{
    description: string;
    durationMinutes: number;
    id: string;
    label: string;
    price: string;
    priceValue: number;
    selected?: boolean;
  }> | null;
  reviews: Array<{ author: string; content: string; date: string; id: string; rating: number }>;
  standards: string[];
  summary: {
    duration: string;
    lines: Array<{ id: string; label: string; value: string }>;
    total: string;
  };
};

export type ChatContact = {
  id: string;
  name: string;
  preview: string;
  timeAgo: string;
};

export type ChatMessage = {
  id: string;
  side: "mine" | "theirs";
  text: string;
};
