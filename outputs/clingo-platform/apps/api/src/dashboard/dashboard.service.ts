import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.module";
import { ChatContact, ChatMessage, DashboardPayload, FavoriteProvider } from "./dashboard.types";

const dashboardPayload: DashboardPayload = {
  user: {
    name: "Kacper Jaskółka",
    phone: "553 068 994",
    initials: "K"
  },
  orders: [
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
  ],
  completedOrder: {
    id: "completed-klaudia",
    status: "Wykonane zlecenie",
    mode: "Jednosesyjne",
    provider: "Klaudia Targówek",
    details: "Sprzątanie obiektów · Mieszkań i domów",
    address: "Warszawa, Floriańska 48/16",
    avatar: "woman",
    dateLines: ["12 Października 2025", "8:45  →  10:30"],
    actions: ["Dodaj opinię", "Zamów ponownie"]
  }
};

@Injectable()
export class DashboardService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getDashboard(): Promise<DashboardPayload> {
    const cacheKey = "dashboard:orders:kacper-jaskolka";

    try {
      if (this.redis.status === "wait") {
        await this.redis.connect();
      }
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as DashboardPayload;
      }
      await this.redis.set(cacheKey, JSON.stringify(dashboardPayload), "EX", 60);
    } catch {
      return dashboardPayload;
    }

    return dashboardPayload;
  }

  getFavorites(): FavoriteProvider[] {
    return [
      {
        id: "stepapp",
        name: "Stepapp",
        completedServices: 166,
        rating: 4.0,
        reviews: 27,
        experience: "5 lata"
      }
    ];
  }

  getChat(): { contacts: ChatContact[]; messages: ChatMessage[] } {
    return {
      contacts: [
        { id: "anita-kowalska", name: "Anita Kowalska", preview: "Dzień dobry, chciałbym popro...", timeAgo: "2 godz." },
        { id: "kajetan-mrowczynski", name: "Kajetan Mrowczyński", preview: "Ty: Dziękuję.", timeAgo: "6 godz." },
        { id: "elzbieta-antkowiak", name: "Elżbieta Antkowiak", preview: "Do zobaczenia, pokaże Pani n...", timeAgo: "1 dzień" },
        { id: "jolanta-bartusiak", name: "Jolanta Bartusiak", preview: "Pod antresolą", timeAgo: "1 tydzień" },
        { id: "aleksander-twarowski", name: "Aleksander Twarowski", preview: "Ty: Nie ma żadnego problemu.", timeAgo: "2 dni" },
        { id: "magdalena-wojcik", name: "Magdalena wójcik", preview: "Pozdrawiam", timeAgo: "3 dni" },
        { id: "michal-trybulec", name: "Michał Trybulec", preview: "Dzień dobry, chciałbym poprosić", timeAgo: "3 dni" },
        { id: "maryla-kacprowska", name: "Maryla Kacprowska", preview: "Ty: Zatem do zobaczenia", timeAgo: "4 dzień" }
      ],
      messages: [
        {
          id: "m1",
          side: "mine",
          text: "Dziękuję za złożenie zamówienia. Chciałabym dopytać o kwestię przekazania kluczy do mieszkania. Czy będzie Pani obecna w dniu sprzątania, czy klucze będą pozostawione w umówionym miejscu?"
        },
        {
          id: "m2",
          side: "theirs",
          text: "Dzień dobry. Nie będę mogła być na miejscu, więc klucze mogę zostawić w skrzynce na listy, kod to 5284."
        }
      ]
    };
  }
}
