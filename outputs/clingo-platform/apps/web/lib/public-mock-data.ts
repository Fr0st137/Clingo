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
  { id: "area", label: "Powierzchnia", value: "60m²" },
  { id: "location", label: "Lokalizacja", value: "Floriańska 48, Warszawa, Polska" }
];

export const boardFilters: FilterGroupData[] = [
  { id: "rating", title: "Ocena", options: ["5", "4", "3", "2", "1"] },
  { id: "price", title: "Cena", options: ["od", "do"] },
  { id: "type", title: "Typ zlecenia", options: ["Jednosesyjne", "Wielosesyjne"] },
  { id: "facilities", title: "Ułatwienia przy zamówieniu", options: ["Bez wymaganych zdjęć lokalu", "Wykonawca zapewnia odkurzacz"] },
  { id: "orders", title: "Min. ilość wykonanych zleceń", options: ["27", "166"] }
];

export const boardListings: BoardListingData[] = [
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
    image: "/figma-assets/board-avatar-paulina.png"
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
    imageScale: "89.28%"
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
    imageFit: "contain"
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
    image: "/figma-assets/board-avatar-klaudia.png"
  },
  {
    id: "perfect-cleaning",
    provider: "Perfect Cleaning",
    rating: 3.1,
    reviews: 11,
    experience: "",
    price: "198,32 zł",
    completedOrders: 28,
    mode: "Jednosesyjne",
    modeTone: "gray",
    image: "/figma-assets/board-perfect-logo.png",
    imageFit: "contain"
  },
  {
    id: "cleanok-pl-1",
    provider: "CleanOk.pl",
    rating: 4.3,
    reviews: 16,
    experience: "",
    price: "241,53 zł",
    completedOrders: 13,
    mode: "Jednosesyjne",
    modeTone: "gray",
    image: "/figma-assets/board-cleanok-logo.png",
    imageFit: "contain"
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
    imageFit: "contain"
  },
  {
    id: "maliwna-k",
    provider: "Maliwna K.",
    rating: 3.7,
    reviews: 5,
    experience: "",
    price: "187,86 zł",
    completedOrders: 11,
    mode: "Wielosesyjne",
    modeTone: "blue",
    image: "/figma-assets/board-avatar-maliwna.png"
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
