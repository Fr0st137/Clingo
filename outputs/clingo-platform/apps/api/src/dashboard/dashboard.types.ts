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
  completedOrder: DashboardOrder;
};

export type FavoriteProvider = {
  id: string;
  name: string;
  completedServices: number;
  rating: number;
  reviews: number;
  experience: string;
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
