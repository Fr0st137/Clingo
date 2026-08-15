export const menuItems = [
  { label: "Rezerwacje", href: "/zamowienia" },
  { label: "Chat", href: "/chat" },
  { label: "Twoje opinie", href: "/opinie" },
  { label: "Ulubione", href: "/ulubione" },
  { label: "Standardy usług Clingo", href: "/standardy-uslug" },
  { label: "Regulaminy", href: "/regulaminy" },
  { label: "Ustawienia", href: "/ustawienia" }
];

export const orders = [
  {
    actions: ["Szczegóły zlecenia", "Odwołaj zlecenie"],
    address: "Warszawa, Marszałkowska 72/9",
    dateLines: ["13 Października 2025", "17 Października 2025"],
    details: "Sprzątanie obiektów · Biur i lokali użytkowych",
    id: "upcoming-stepapp",
    logo: "stepapp",
    mode: "Wielosesyjne",
    modeTone: "blue",
    provider: "Stepapp",
    range: true,
    status: "Nadchodzące zlecenie"
  },
  {
    actions: ["Szczegóły zlecenia", "Przełóż zlecenie", "Odwołaj zlecenie"],
    address: "Warszawa, Floriańska 48/16",
    avatar: "paulina",
    dateLines: ["12 Października 2025", "8:45", "10:30"],
    details: "Sprzątanie obiektów · Mieszkań i domów",
    id: "upcoming-paulina",
    mode: "Jednosesyjne",
    provider: "Paulina Jagielska",
    status: "Nadchodzące zlecenie"
  }
];

export const completedOrder = {
  actions: ["Dodaj opinię", "Zamów ponownie"],
  address: "Warszawa, Floriańska 48/16",
  avatar: "klaudia",
  dateLines: ["12 Października 2025", "8:45", "10:30"],
  details: "Sprzątanie obiektów · Mieszkań i domów",
  id: "completed-klaudia",
  mode: "Jednosesyjne",
  provider: "Klaudia Targówek",
  status: "Wykonane zlecenie"
};

export const user = {
  initials: "K",
  name: "Kacper Jaskółka",
  phone: "553 068 994"
};

export const dashboardFallback = {
  completedOrder,
  orders,
  user
};
