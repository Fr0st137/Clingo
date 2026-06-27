export interface ReviewImage {
  id: string;
  label: string;
}

export interface ReviewCardData {
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
}

export interface PendingReviewData {
  id: string;
  person: string;
  service: string;
  avatarTone: "person" | "brand" | "light";
}

export interface SettingsFieldData {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
}

export interface SettingsSectionData {
  id: string;
  title: string;
  description: string;
  fields?: SettingsFieldData[];
  actionLabel?: string;
}

export interface NotificationSettingData {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface ExternalConnectionData {
  id: string;
  provider: string;
  icon: string;
}

export const pendingReviews: PendingReviewData[] = [
  {
    id: "karolina-pokulska",
    person: "Karolina Pokulska",
    service: "Sprzątanie obiektów · Biur i lokali użytkowych",
    avatarTone: "person"
  }
];

export const userReviews: ReviewCardData[] = [
  {
    id: "paulina-jagielska",
    person: "Paulina Jagielska",
    service: "Sprzątanie obiektów · Biur i lokali użytkowych",
    rating: 5,
    date: "11 Sier 2025",
    content:
      "Pani Paulina wykonała wyjątkową pracę, sprzątając nasze trzypokojowe mieszkanie. Była punktualna, dokładna i bardzo profesjonalna. Dbałość o szczegóły zrobiła wrażenie - nawet uporządkowała nasze szafki kuchenne, mimo że nikt jej o to nie prosił. Gorąco polecam!",
    images: [
      { id: "salon", label: "Salon po sprzątaniu" },
      { id: "kuchnia", label: "Kuchnia po sprzątaniu" },
      { id: "pokoj", label: "Pokój po sprzątaniu" }
    ],
    avatarTone: "person",
    editable: true
  },
  {
    id: "stepapp",
    person: "Stepapp",
    service: "Sprzątanie obiektów · Biur i lokali użytkowych",
    rating: 5,
    date: "11 Cze 2025",
    content: "Super!",
    avatarTone: "brand",
    editable: true
  },
  {
    id: "karolina-pokulska-reviewed",
    person: "Karolina Pokulska",
    service: "Sprzątanie obiektów · Biur i lokali użytkowych",
    rating: 5,
    date: "22 Maj 2025",
    content:
      "Pani Karolina spisała się znakomicie - mieszkanie po sprzątaniu wyglądało jak nowe, a jej sumienność i profesjonalne podejście naprawdę robią wrażenie.",
    avatarTone: "person",
    editable: true
  }
];

export const standardsReviews: ReviewCardData[] = [
  {
    id: "standard-paulina",
    person: "Paulina Jagielska",
    service: "Sprzątanie obiektów · Biur i lokali użytkowych",
    author: "Kacper Jaskółka",
    rating: 5,
    date: "11 Sier 2025",
    content:
      "Pani Paulina wykonała wyjątkową pracę, sprzątając nasze trzypokojowe mieszkanie. Była punktualna, dokładna i bardzo profesjonalna. Dbałość o szczegóły zrobiła wrażenie - nawet uporządkowała nasze szafki kuchenne, mimo że nikt jej o to nie prosił. Gorąco polecam!",
    avatarTone: "person",
    editable: true
  },
  {
    id: "standard-stepapp",
    person: "Stepapp",
    service: "Sprzątanie obiektów · Biur i lokali użytkowych",
    author: "Kacper Jaskółka",
    rating: 5,
    date: "4 Cze 2025",
    content: "Super!",
    avatarTone: "brand",
    editable: true
  },
  {
    id: "standard-karolina",
    person: "Karolina Pokulska",
    service: "Sprzątanie obiektów · Biur i lokali użytkowych",
    author: "Kacper Jaskółka",
    rating: 5,
    date: "22 Maj 2025",
    content:
      "Pani Karolina spisała się znakomicie - mieszkanie po sprzątaniu wyglądało jak nowe, a jej sumienność i profesjonalne podejście naprawdę robią wrażenie.",
    avatarTone: "person",
    editable: true
  }
];

export const regulationsReviews: ReviewCardData[] = standardsReviews.map((review) => ({
  ...review,
  id: review.id.replace("standard", "regulamin")
}));

export const personalSettings: SettingsSectionData = {
  id: "personal",
  title: "Informacje personalne",
  description: "Zarządzaj swoimi danymi kontaktowymi.",
  fields: [
    { id: "name", label: "Imię i nazwisko", value: "Kacper Jaskółka" },
    { id: "birthDate", label: "Data urodzenia", value: "", placeholder: "DD-MM-RRRR" },
    { id: "email", label: "Adres e-mail", value: "paulina.jagielska@gmail.com", type: "email" },
    { id: "phone", label: "Numer telefonu", value: "+48 547 658 236" }
  ]
};

export const addressSettings: SettingsSectionData = {
  id: "address",
  title: "Adres",
  description: "Twój adres wykorzystujemy jedynie do realizacji usługi.",
  fields: [
    { id: "street", label: "Ulica", value: "", placeholder: "Wpisz ulicę" },
    { id: "apartment", label: "Numer mieszkania", value: "", placeholder: "Opcjonalnie" },
    { id: "city", label: "Miasto", value: "", placeholder: "Wpisz miasto" },
    { id: "postalCode", label: "Kod pocztowy", value: "", placeholder: "00-000" }
  ]
};

export const passwordSettings: SettingsSectionData = {
  id: "password",
  title: "Zmień hasło",
  description: "Uaktualnij swoje hasło bezpieczeństwa.",
  actionLabel: "Zmień hasło",
  fields: [
    { id: "newPassword", label: "Nowe hasło", value: "••••••••", type: "password" },
    { id: "confirmPassword", label: "Potwierdź hasło", value: "••••••••", type: "password" }
  ]
};

export const notificationSettings: NotificationSettingData[] = [
  {
    id: "email",
    title: "Powiadomienia e-mail",
    description: "Otrzymuj e-maile o zmianach statusu zamówienia.",
    enabled: true
  },
  {
    id: "sms",
    title: "Powiadomienia SMS",
    description: "Otrzymuj SMS-y o ważnych zdarzeniach.",
    enabled: true
  }
];

export const externalConnections: ExternalConnectionData[] = [
  { id: "google", provider: "Połącz konto z Google", icon: "G" },
  { id: "facebook", provider: "Połącz konto z Facebook", icon: "f" },
  { id: "apple", provider: "Połącz konto z Apple", icon: "●" }
];
