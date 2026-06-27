import { Award, CheckCircle2, Clock, LucideIcon, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";

export interface ProviderMetricData {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
}

export interface ProviderGalleryImageData {
  id: string;
  label: string;
  gradient: string;
}

export interface ProviderReviewData {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
}

export interface OrderSummaryLineData {
  id: string;
  label: string;
  value: string;
}

export interface ProviderProfileData {
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
  metrics: ProviderMetricData[];
  gallery: ProviderGalleryImageData[];
  reviews: ProviderReviewData[];
  standards: string[];
  summary: {
    duration: string;
    lines: OrderSummaryLineData[];
    total: string;
  };
}

export const providerProfile: ProviderProfileData = {
  provider: "Paulina Jagielska",
  verified: true,
  service: "Sprzątanie obiektów · Mieszkań i domów",
  location: "Warszawa, Floriańska 48/16",
  rating: 5.0,
  reviewsCount: 11,
  experience: "3 lata",
  completedOrders: 87,
  priceFrom: "od 148 zł",
  tags: ["Jednosesyjne", "Odkurzacz", "Mycie okien", "Piekarnik"],
  description:
    "Dokładne sprzątanie mieszkań i domów z dbałością o szczegóły. Pracuję samodzielnie, punktualnie i zawsze ustalam zakres prac przed realizacją usługi.",
  metrics: [
    { id: "rating", label: "Średnia ocena", value: "5.0", icon: Star },
    { id: "orders", label: "Wykonane usługi", value: "87", icon: CheckCircle2 },
    { id: "experience", label: "Doświadczenie", value: "3 lata", icon: Award },
    { id: "location", label: "Obsługiwany obszar", value: "Warszawa", icon: MapPin }
  ],
  gallery: [
    { id: "salon", label: "Salon po sprzątaniu", gradient: "from-[#c9b9a3] to-[#f3e3ce]" },
    { id: "kuchnia", label: "Kuchnia po sprzątaniu", gradient: "from-[#c7d0cf] to-[#8d9b93]" },
    { id: "lazienka", label: "Łazienka po sprzątaniu", gradient: "from-[#dbe8f6] to-[#aabbd0]" }
  ],
  reviews: [
    {
      id: "michal",
      author: "Michał T.",
      rating: 5,
      date: "2 tyg. temu",
      content:
        "Paulina wykonała wyjątkową pracę, sprzątając nasze trzypokojowe mieszkanie. Była punktualna, dokładna i bardzo profesjonalna."
    },
    {
      id: "izabela",
      author: "Izabela N.",
      rating: 5,
      date: "7 tyg. temu",
      content:
        "Mieszkanie po sprzątaniu wyglądało jak nowe, a jej sumienność i profesjonalne podejście naprawdę robią wrażenie."
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
      { id: "travel", label: "Dojazd do lokalizacji", value: "0 zł" },
      { id: "oven", label: "Mycie piekarnika (1 szt.)", value: "24 zł" },
      { id: "windows", label: "Mycie okien (4 szt.)", value: "48 zł" }
    ],
    total: "165 zł"
  }
};

export const providerTrustItems = [
  { id: "verified", label: "Zweryfikowany profil", icon: ShieldCheck },
  { id: "quick", label: "Szybki kontakt po zamówieniu", icon: Clock },
  { id: "quality", label: "Usługa zgodna ze standardami Clingo", icon: Sparkles }
];
