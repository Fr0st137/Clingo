const { Client } = require("pg");

const serviceByMode = {
  "Jednosesyjne": "Sprzatanie obiektow - Mieszkan i domow",
  "Wielosesyjne": "Sprzatanie obiektow - Biur i lokali uzytkowych"
};

const defaultListings = [
  { id: "paulina-jagielska", provider: "Paulina Jagielska", rating: 4.7, reviews: 13, experience: "2 lata", price: "165,00 zl", completedOrders: 18, mode: "Jednosesyjne" },
  { id: "stepapp", provider: "Stepapp", rating: 4.0, reviews: 27, experience: "5 lat", price: "265,76 zl", completedOrders: 166, mode: "Wielosesyjne" },
  { id: "mobimop", provider: "MobiMop", rating: 4.9, reviews: 16, experience: "2 lata", price: "217,10 zl", completedOrders: 34, mode: "Jednosesyjne" },
  { id: "klaudia-tarnowek", provider: "Klaudia Tarnowek", rating: 5.0, reviews: 7, experience: "2 lata", price: "185,48 zl", completedOrders: 16, mode: "Wielosesyjne" },
  { id: "perfect-cleaning", provider: "Perfect Cleaning", rating: 3.1, reviews: 11, experience: "4 lata", price: "198,32 zl", completedOrders: 28, mode: "Jednosesyjne" },
  { id: "cleanok-pl-1", provider: "CleanOk.pl", rating: 4.3, reviews: 16, experience: "2 lata", price: "241,53 zl", completedOrders: 13, mode: "Jednosesyjne" },
  { id: "cleanok-pl-2", provider: "CleanOk.pl", rating: 3.0, reviews: 1, experience: "6 mies.", price: "209,26 zl", completedOrders: 4, mode: "Jednosesyjne" },
  { id: "maliwna-k", provider: "Maliwna K.", rating: 3.7, reviews: 5, experience: "1 rok", price: "187,86 zl", completedOrders: 11, mode: "Wielosesyjne" },
  { id: "anna-kowal", provider: "Anna Kowal", rating: 4.8, reviews: 31, experience: "6 lat", price: "176,40 zl", completedOrders: 73, mode: "Jednosesyjne" },
  { id: "dom-clean", provider: "Dom Clean", rating: 4.6, reviews: 19, experience: "3 lata", price: "224,90 zl", completedOrders: 52, mode: "Wielosesyjne" }
];

function priceValue(price) {
  const normalized = String(price).replace(",", ".").replace(/[^\d.]/g, "");
  return Math.round(Number(normalized || 0));
}

function profileFromListing(listing) {
  const rating = Number(listing.rating);
  const reviewsCount = Number(listing.reviews);
  const completedOrders = Number(listing.completedOrders);
  const mode = listing.mode || "Jednosesyjne";
  const service = serviceByMode[mode] || serviceByMode.Jednosesyjne;
  const basePrice = priceValue(listing.price);
  const duration = mode === "Wielosesyjne" ? "4 godziny" : "3 godziny 30 minut";

  return {
    id: listing.id,
    provider: listing.provider,
    verified: true,
    service,
    location: "Warszawa",
    rating,
    reviewsCount,
    experience: listing.experience || "1 rok",
    completedOrders,
    priceFrom: `od ${basePrice} zl`,
    tags: mode === "Wielosesyjne" ? ["Wielosesyjne", "Staly harmonogram", "Wlasny sprzet", "Biura"] : ["Jednosesyjne", "Mieszkania", "Mycie okien", "Kuchnia"],
    description: `${listing.provider} to testowy profil wykonawcy Clingo z pelna struktura danych profilu ogloszeniowego. Profil zawiera cennik, uslugi dodatkowe, opinie, standardy i podsumowanie zamowienia.`,
    metrics: [
      { id: "rating", label: "Srednia ocena", value: rating.toFixed(1) },
      { id: "orders", label: "Wykonane uslugi", value: String(completedOrders) },
      { id: "experience", label: "Doswiadczenie", value: listing.experience || "1 rok" },
      { id: "location", label: "Obslugiwany obszar", value: "Warszawa" }
    ],
    gallery: [
      { id: "main", label: "Realizacja po sprzataniu", gradient: "from-[#dbe8f6] to-[#aabbd0]" },
      { id: "kitchen", label: "Kuchnia po sprzataniu", gradient: "from-[#d8e5d0] to-[#f7fbf2]" },
      { id: "details", label: "Detale po realizacji", gradient: "from-[#ead6c8] to-[#fff4ec]" }
    ],
    overview: [
      { id: "rating", label: "Ocena", value: rating.toFixed(1) },
      { id: "reviews", label: "Opinie", value: String(reviewsCount) },
      { id: "orders", label: "Wykonane uslugi", value: String(completedOrders) },
      { id: "experience", label: "Doswiadczenie", value: listing.experience || "1 rok" }
    ],
    photos: [
      { id: "main", label: "Realizacja po sprzataniu", gradient: "linear-gradient(135deg, #dbe8f6 0%, #aabbd0 100%)" },
      { id: "kitchen", label: "Kuchnia po sprzataniu", gradient: "linear-gradient(135deg, #d8e5d0 0%, #f7fbf2 100%)" },
      { id: "bathroom", label: "Lazienka po sprzataniu", gradient: "linear-gradient(135deg, #d7e8f6 0%, #b5cce0 100%)" },
      { id: "hall", label: "Przedpokoj po sprzataniu", gradient: "linear-gradient(135deg, #e7e3dc 0%, #c7d1dd 100%)" },
      { id: "work-area", label: "Strefa pracy po realizacji", gradient: "linear-gradient(135deg, #dcd8e8 0%, #fbf9ff 100%)" },
      { id: "details", label: "Detale po usludze", gradient: "linear-gradient(135deg, #e2e7e9 0%, #ffffff 100%)" }
    ],
    pricing: [
      {
        id: "basic",
        label: mode === "Wielosesyjne" ? "Regularne sprzatanie lokalu" : "Jednorazowe sprzatanie mieszkania",
        description: "Zakres podstawowy z dojazdem do lokalizacji.",
        price: `${basePrice} zl`,
        priceValue: basePrice,
        duration
      },
      {
        id: "extended",
        label: mode === "Wielosesyjne" ? "Rozszerzone sprzatanie lokalu" : "Rozszerzone sprzatanie mieszkania",
        description: "Wiekszy zakres prac i dluzszy czas realizacji.",
        price: `${basePrice + 58} zl`,
        priceValue: basePrice + 58,
        duration: mode === "Wielosesyjne" ? "5 godzin 30 minut" : "4 godziny 30 minut"
      }
    ],
    frequencies: [
      { id: "once", label: "Jednorazowo", description: "Pojedyncza realizacja bez stalego harmonogramu.", discount: "0%" },
      { id: "weekly", label: "Co tydzien", description: "Staly termin i powtarzalny zakres sprzatania.", discount: "-8%" },
      { id: "biweekly", label: "Co 2 tygodnie", description: "Regularne sprzatanie w wygodnym rytmie.", discount: "-5%" }
    ],
    addOns: [
      { id: "window-cleaning", label: "Mycie okien", description: "Mycie szyb, ram i parapetow.", price: "48 zl", priceValue: 48, durationMinutes: 40, selected: true },
      { id: "oven-cleaning", label: "Mycie piekarnika", description: "Czyszczenie wnetrza i szyby piekarnika.", price: "24 zl", priceValue: 24, durationMinutes: 25 },
      { id: "fridge-cleaning", label: "Czyszczenie lodowki", description: "Umycie polek, szuflad i wnetrza lodowki.", price: "32 zl", priceValue: 32, durationMinutes: 25 },
      { id: "cabinet-inside", label: "Sprzatanie wnetrza szafek", description: "Przetarcie i uporzadkowanie wnetrza szafek.", price: "36 zl", priceValue: 36, durationMinutes: 30 }
    ],
    reviews: [
      { id: "review-1", author: "Kacper J.", rating: Math.max(3, Math.round(rating)), date: "2 tyg. temu", content: "Usluga wykonana zgodnie z ustalonym zakresem i w dobrym kontakcie." },
      { id: "review-2", author: "Anna M.", rating: Math.max(3, Math.round(rating)), date: "1 mies. temu", content: "Sprawna realizacja, jasne ustalenia i porzadek po zakonczeniu prac." }
    ],
    standards: [
      "Wykonawca potwierdza zakres uslugi przed rozpoczeciem pracy.",
      "Rozliczenie odbywa sie bezposrednio z wykonawca po realizacji.",
      "Zdjecia lokalu nie sa wymagane przy tym typie zamowienia.",
      "Mozliwosc dobrania uslug dodatkowych do zamowienia."
    ],
    summary: {
      duration,
      lines: [
        { id: "service", label: "Zakres podstawowy", value: `${Math.max(0, basePrice - 20)} zl` },
        { id: "travel", label: "Dojazd do lokalizacji", value: "20 zl" }
      ],
      total: `${basePrice} zl`
    }
  };
}

async function main() {
  const client = new Client({
    database: process.env.POSTGRES_DB || "clingo",
    host: process.env.POSTGRES_HOST || "127.0.0.1",
    password: process.env.POSTGRES_PASSWORD || "clingo",
    port: Number(process.env.POSTGRES_PORT || 55432),
    user: process.env.POSTGRES_USER || "clingo"
  });

  await client.connect();
  await client.query(`
    create table if not exists provider_profiles (
      id varchar primary key,
      provider varchar not null,
      verified boolean not null default true,
      service varchar not null,
      location varchar not null,
      rating numeric(2, 1) not null,
      "reviewsCount" integer not null,
      experience varchar not null,
      "completedOrders" integer not null,
      "priceFrom" varchar not null,
      tags text not null,
      description text not null,
      metrics text not null,
      gallery text not null,
      overview text,
      photos text,
      pricing text,
      frequencies text,
      "addOns" text,
      reviews text not null,
      standards text not null,
      summary text not null
    )
  `);

  let listings = defaultListings;
  try {
    const result = await client.query('select id, provider, rating::float as rating, reviews, experience, price, "completedOrders", mode from board_listings order by "orderIndex" asc');
    if (result.rows.length > 0) {
      listings = result.rows;
    }
  } catch {
    // The fallback list keeps first-run seeding useful when board data is not present yet.
  }

  let inserted = 0;
  for (const listing of listings) {
    const profile = profileFromListing(listing);
    const result = await client.query(
      `insert into provider_profiles (
        id, provider, verified, service, location, rating, "reviewsCount", experience, "completedOrders", "priceFrom",
        tags, description, metrics, gallery, overview, photos, pricing, frequencies, "addOns", reviews, standards, summary
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      )
      on conflict (id) do nothing`,
      [
        profile.id,
        profile.provider,
        profile.verified,
        profile.service,
        profile.location,
        profile.rating,
        profile.reviewsCount,
        profile.experience,
        profile.completedOrders,
        profile.priceFrom,
        JSON.stringify(profile.tags),
        profile.description,
        JSON.stringify(profile.metrics),
        JSON.stringify(profile.gallery),
        JSON.stringify(profile.overview),
        JSON.stringify(profile.photos),
        JSON.stringify(profile.pricing),
        JSON.stringify(profile.frequencies),
        JSON.stringify(profile.addOns),
        JSON.stringify(profile.reviews),
        JSON.stringify(profile.standards),
        JSON.stringify(profile.summary)
      ]
    );
    inserted += result.rowCount;
  }

  await client.end();
  console.log(`Provider profiles ready. Added ${inserted} missing profile(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
