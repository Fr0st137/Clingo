import { Bath, Building2, Home, LucideIcon, ShieldCheck, Sparkles, Star, Timer, WashingMachine } from "lucide-react";

export interface SearchFieldData {
  id: string;
  label: string;
  value: string;
}

export interface FilterGroupData {
  id: string;
  title: string;
  options: string[];
}

export interface BoardListingData {
  id: string;
  provider: string;
  service: string;
  rating: number;
  reviews: number;
  experience: string;
  price: string;
  completedOrders: number;
  location: string;
  tags: string[];
  favorite?: boolean;
  avatarTone: "brand" | "person" | "neutral";
}

export interface HomeStepData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ServiceCategoryData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const boardSearchFields: SearchFieldData[] = [
  { id: "service", label: "Rodzaj usługi", value: "Sprzątanie obiektów · Mieszkań i domów" },
  { id: "area", label: "Powierzchnia", value: "60 m²" },
  { id: "location", label: "Lokalizacja", value: "Floriańska 48, Warszawa, Polska" }
];

export const boardFilters: FilterGroupData[] = [
  { id: "rating", title: "Ocena", options: ["5 ★", "4 ★", "3 ★", "2 ★", "1 ★"] },
  { id: "price", title: "Cena", options: ["od", "do"] },
  { id: "type", title: "Typ zlecenia", options: ["Jednosesyjne", "Wielosesyjne"] },
  { id: "facilities", title: "Ułatwienia przy zamówieniu", options: ["Bez wymaganych zdjęć lokalu", "Wykonawca zapewnia odkurzacz"] },
  { id: "orders", title: "Min. ilość wykonanych zleceń", options: ["27", "166"] }
];

export const boardListings: BoardListingData[] = [
  {
    id: "stepapp",
    provider: "Stepapp",
    service: "Sprzątanie obiektów · Mieszkań i domów",
    rating: 4.0,
    reviews: 27,
    experience: "5 lata",
    price: "od 165 zł",
    completedOrders: 166,
    location: "Warszawa, Floriańska 48/16",
    tags: ["Jednosesyjne", "Wielosesyjne"],
    favorite: true,
    avatarTone: "brand"
  },
  {
    id: "paulina-jagielska",
    provider: "Paulina Jagielska",
    service: "Sprzątanie obiektów · Mieszkań i domów",
    rating: 5.0,
    reviews: 11,
    experience: "3 lata",
    price: "od 148 zł",
    completedOrders: 87,
    location: "Warszawa, Śródmieście",
    tags: ["Jednosesyjne", "Odkurzacz"],
    avatarTone: "person"
  },
  {
    id: "karolina-pokulska",
    provider: "Karolina Pokulska",
    service: "Sprzątanie obiektów · Biur i lokali użytkowych",
    rating: 4.8,
    reviews: 22,
    experience: "4 lata",
    price: "od 190 zł",
    completedOrders: 103,
    location: "Warszawa, Mokotów",
    tags: ["Biura", "Wielosesyjne"],
    avatarTone: "person"
  },
  {
    id: "czysty-dom",
    provider: "Czysty Dom",
    service: "Sprzątanie obiektów · Mieszkań i domów",
    rating: 4.7,
    reviews: 19,
    experience: "6 lat",
    price: "od 172 zł",
    completedOrders: 141,
    location: "Warszawa, Wola",
    tags: ["Okna", "Piekarnik"],
    avatarTone: "neutral"
  }
];

export const homeSteps: HomeStepData[] = [
  {
    id: "search",
    title: "Wybierz usługę",
    description: "Określ rodzaj sprzątania, metraż i lokalizację.",
    icon: Sparkles
  },
  {
    id: "compare",
    title: "Porównaj wykonawców",
    description: "Sprawdź oceny, doświadczenie i liczbę zrealizowanych usług.",
    icon: Star
  },
  {
    id: "book",
    title: "Zamów termin",
    description: "Złóż zamówienie i ustal szczegóły bezpośrednio z wykonawcą.",
    icon: Timer
  }
];

export const serviceCategories: ServiceCategoryData[] = [
  {
    id: "homes",
    title: "Mieszkania i domy",
    description: "Regularne lub jednorazowe sprzątanie przestrzeni prywatnych.",
    icon: Home
  },
  {
    id: "offices",
    title: "Biura i lokale",
    description: "Czyste miejsca pracy, gabinety i lokale użytkowe.",
    icon: Building2
  },
  {
    id: "bathroom",
    title: "Łazienki i kuchnie",
    description: "Dokładne czyszczenie miejsc wymagających większej uwagi.",
    icon: Bath
  },
  {
    id: "additional",
    title: "Usługi dodatkowe",
    description: "Mycie okien, piekarnika, odkurzanie i prace specjalne.",
    icon: WashingMachine
  }
];

export const trustItems = [
  { id: "verified", label: "Zweryfikowani wykonawcy", icon: ShieldCheck },
  { id: "rating", label: "Opinie po realizacji", icon: Star },
  { id: "time", label: "Szybkie porównanie ofert", icon: Timer }
];
