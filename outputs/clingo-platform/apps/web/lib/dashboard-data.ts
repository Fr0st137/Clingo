import {
  Heart,
  MessageCircle,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  WalletCards
} from "lucide-react";

export const menuItems = [
  { label: "Zamówienie", icon: WalletCards, href: "/" },
  { label: "Chat", icon: MessageCircle, href: "/chat" },
  { label: "Twoje opinie", icon: Star, href: "/opinie" },
  { label: "Ulubione", icon: Heart, href: "/ulubione" },
  { label: "Standardy usług Clingo", icon: ShieldCheck, href: "/standardy-uslug" },
  { label: "Regulaminy", icon: ScrollText, href: "/regulaminy" },
  { label: "Ustawienia", icon: Settings, href: "/ustawienia" }
];

export const orders = [
  {
    id: "upcoming-stepapp",
    status: "Nadchodzące zlecenie",
    mode: "Wielosesyjne",
    modeTone: "blue",
    provider: "Stepapp",
    details: "Sprzątanie obiektów · Biur i lokali użytkowych",
    address: "Warszawa, Marszałkowska 72/9",
    logo: "stepapp",
    dateLines: ["13 Października 2025", "17 Października 2025"],
    range: true,
    actions: ["Szczegóły zlecenia", "Odwołaj zlecenie"]
  },
  {
    id: "upcoming-paulina",
    status: "Nadchodzące zlecenie",
    mode: "Jednosesyjne",
    provider: "Paulina Jagielska",
    details: "Sprzątanie obiektów · Mieszkań i domów",
    address: "Warszawa, Floriańska 48/16",
    avatar: "woman",
    dateLines: ["12 Października 2025", "8:45  →  10:30"],
    actions: ["Szczegóły zlecenia", "Przełóż zlecenie", "Odwołaj zlecenie"]
  }
];

export const completedOrder = {
  id: "completed-klaudia",
  status: "Wykonane zlecenie",
  mode: "Jednosesyjne",
  provider: "Klaudia Targówek",
  details: "Sprzątanie obiektów · Mieszkań i domów",
  address: "Warszawa, Floriańska 48/16",
  dateLines: ["12 Października 2025", "8:45  →  10:30"],
  actions: ["Dodaj opinię", "Zamów ponownie"]
};

export const user = {
  name: "Kacper Jaskółka",
  phone: "553 068 994",
  initials: "K"
};

export const dashboardFallback = {
  user,
  orders,
  completedOrder
};

export const UserIcon = UserRound;
