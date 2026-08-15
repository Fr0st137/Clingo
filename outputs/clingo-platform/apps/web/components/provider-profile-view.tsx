import { Award, Check, CheckCircle2, ChevronLeft, Clock, Heart, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";

export interface ProviderProfileData {
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
  gallery: Array<{ id: string; label: string; gradient: string }>;
  overview?: Array<{ id: string; label: string; value: string }>;
  photos?: Array<{ id: string; label: string; gradient: string; image?: string }>;
  pricing?: Array<{ id: string; label: string; description: string; price: string; priceValue: number; duration: string }>;
  frequencies?: Array<{ id: string; label: string; description: string; discount: string }>;
  addOns?: Array<{
    id: string;
    label: string;
    description: string;
    price: string;
    priceValue: number;
    durationMinutes: number;
    selected?: boolean;
  }>;
  reviews: Array<{ id: string; author: string; rating: number; date: string; content: string }>;
  standards: string[];
  summary: {
    duration: string;
    lines: Array<{ id: string; label: string; value: string }>;
    total: string;
  };
}

const providerTrustItems = [
  { id: "verified", label: "Zweryfikowany profil", icon: ShieldCheck },
  { id: "quick", label: "Szybki kontakt po zamówieniu", icon: Clock },
  { id: "quality", label: "Usługa zgodna ze standardami Clingo", icon: Sparkles }
];

const metricIcons = {
  experience: Award,
  location: MapPin,
  orders: CheckCircle2,
  rating: Star
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex text-[#f2bd1d]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star className={index < rating ? "h-4 w-4 fill-current" : "h-4 w-4"} key={index} />
      ))}
    </span>
  );
}

function ProviderAvatar() {
  return (
    <div className="h-[88px] w-[88px] shrink-0 rounded-full bg-[radial-gradient(circle_at_50%_34%,#4a3124_0_13%,transparent_14%),radial-gradient(circle_at_50%_72%,#eac09c_0_31%,transparent_32%),linear-gradient(135deg,#f8decf,#fff2e9)] md:h-[112px] md:w-[112px]" />
  );
}

export function ProviderProfileView({ profile }: { profile: ProviderProfileData }) {
  return (
    <section className="grid gap-5 pb-12 md:grid-cols-[minmax(0,800px)_380px]">
      <div className="grid gap-5">
        <a className="inline-flex w-fit items-center gap-2 text-[13px] font-semibold text-clingo-blue" href="/tablica-ogloszen">
          <ChevronLeft className="h-4 w-4" />
          Wróć do tablicy ogłoszeń
        </a>

        <article className="rounded-xl border border-[#dce6f2] bg-white p-5 shadow-figma md:p-6">
          <div className="grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-start">
            <ProviderAvatar />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold text-clingo-ink">{profile.provider}</h1>
                {profile.verified ? (
                  <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#e6f3ff] px-3 text-[12px] font-semibold text-clingo-blue">
                    <Check className="h-3 w-3" />
                    Zweryfikowana
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[14px] text-clingo-muted">{profile.service}</p>
              <p className="mt-2 flex items-center gap-2 text-[13px] text-clingo-muted">
                <MapPin className="h-4 w-4 text-clingo-blue" />
                {profile.location}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-[#536479]">
                <span className="inline-flex items-center gap-2">
                  <RatingStars rating={profile.rating} />
                  {profile.rating.toFixed(1)}
                </span>
                <span>({profile.reviewsCount} ocen)</span>
                <span>Doświadczenie: {profile.experience}</span>
                <span>{profile.completedOrders} wykonanych usług</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <span className="rounded-full bg-[#f3f6fa] px-3 py-1 text-[12px] text-[#66788e]" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              aria-label="Dodaj do ulubionych"
              className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#fff0f2] text-[#ed3d4d] transition-all hover:bg-[#ffe5e9]"
              type="button"
            >
              <Heart className="h-5 w-5 fill-current" />
            </button>
          </div>
        </article>

        <section className="grid gap-4 md:grid-cols-4">
          {profile.metrics.map(({ id, label, value }) => {
            const Icon = metricIcons[id as keyof typeof metricIcons] ?? CheckCircle2;

            return (
              <article className="rounded-xl border border-[#dce6f2] bg-white p-4 shadow-figma" key={id}>
                <Icon className="h-5 w-5 text-clingo-blue" />
                <p className="mt-4 text-2xl font-extrabold text-clingo-ink">{value}</p>
                <p className="mt-1 text-[12px] text-clingo-muted">{label}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-xl border border-[#dce6f2] bg-white p-5 shadow-figma">
          <h2 className="text-[18px] font-bold text-clingo-ink">O wykonawcy</h2>
          <p className="mt-3 text-[14px] leading-7 text-[#34465d]">{profile.description}</p>
          <div className="mt-5 grid gap-3">
            {providerTrustItems.map(({ id, label, icon: Icon }) => (
              <div className="flex items-center gap-3 rounded-xl bg-[#f7f9fc] p-3" key={id}>
                <Icon className="h-5 w-5 text-clingo-blue" />
                <span className="text-[13px] font-semibold text-clingo-ink">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#dce6f2] bg-white p-5 shadow-figma">
          <h2 className="text-[18px] font-bold text-clingo-ink">Galeria realizacji</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {profile.gallery.map((image) => (
              <div className={`h-[150px] rounded-xl bg-gradient-to-br ${image.gradient}`} key={image.id}>
                <span className="sr-only">{image.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#dce6f2] bg-white p-5 shadow-figma">
          <h2 className="text-[18px] font-bold text-clingo-ink">Opinie klientów</h2>
          <div className="mt-4 grid gap-4">
            {profile.reviews.map((review) => (
              <article className="rounded-xl bg-[#f7f9fc] p-4" key={review.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-[14px] font-bold text-clingo-ink">{review.author}</h3>
                    <p className="text-[12px] text-clingo-muted">{review.date}</p>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                <p className="mt-3 text-[13px] leading-6 text-[#34465d]">{review.content}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <aside className="grid gap-5 self-start md:sticky md:top-24">
        <section className="rounded-[32px] border border-[#dce6f2] bg-white p-8 shadow-figma">
          <h2 className="text-2xl font-extrabold text-clingo-ink">Podsumowanie</h2>
          <div className="mt-5 rounded-xl bg-[#f7f9fc] p-4">
            <p className="text-[13px] text-clingo-muted">Szacowany czas realizacji</p>
            <p className="mt-2 inline-flex rounded-xl border border-[#dfe8f2] bg-white px-4 py-2 text-[15px] text-clingo-ink">
              {profile.summary.duration}
            </p>
          </div>

          <dl className="mt-5 grid gap-3 rounded-xl bg-[#f7f9fc] p-4 text-[14px]">
            {profile.summary.lines.map((line) => (
              <div className="flex justify-between gap-4" key={line.id}>
                <dt className="text-clingo-muted">{line.label}</dt>
                <dd className="font-semibold text-clingo-ink">{line.value}</dd>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-[#dbe4ee] pt-4 font-extrabold text-clingo-ink">
              <dt>Suma</dt>
              <dd>{profile.summary.total}</dd>
            </div>
          </dl>

          <a
            className="mt-5 flex h-[46px] w-full items-center justify-center rounded-full bg-clingo-blue text-[15px] font-bold text-white transition-all hover:bg-clingo-blueDark"
            href="/zamowienie"
          >
            Przejdź do zamówienia
          </a>
        </section>

        <section className="rounded-[24px] border border-[#dce6f2] bg-white p-6 shadow-figma">
          <h3 className="text-[15px] font-extrabold text-clingo-ink">Standardy usługi</h3>
          <div className="mt-4 grid gap-3">
            {profile.standards.map((standard) => (
              <div className="flex gap-3 text-[13px] leading-5 text-[#34465d]" key={standard}>
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-clingo-blue" />
                <span>{standard}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
