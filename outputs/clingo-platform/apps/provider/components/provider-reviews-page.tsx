import { ProviderShell } from "./provider-shell";

const reviewAsset = (name: string) => `/figma-assets/reviews/${name}`;

const reviews = [
  {
    name: "Michał Trybulec",
    age: "2 tyg. temu",
    likes: 4,
    message:
      "Paulina wykonała wyjątkową pracę, sprzątając nasze trzypokojowe mieszkanie. Była punktualna, dokładna i bardzo profesjonalna. Dbałość o szczegóły zrobiła wrażenie — nawet uporządkowała nasze szafki kuchenne, mimo że nikt jej o to nie prosił. Gorąco polecam!"
  },
  {
    name: "Magdalena wójcik",
    age: "7 tyg. temu",
    likes: 0,
    message:
      "Pani Paulina spisała się znakomicie — mieszkanie po sprzątaniu wyglądało jak nowe, a jej sumienność i profesjonalne podejście naprawdę robią wrażenie."
  },
  {
    name: "Tomasz Lamel",
    age: "4 tyg. temu",
    likes: 0,
    message:
      "Pani Paulina spisała się znakomicie — mieszkanie po sprzątaniu wyglądało jak nowe, a jej sumienność i profesjonalne podejście naprawdę robią wrażenie."
  },
  {
    name: "Izabela Nastrycka",
    age: "7 tyg. temu",
    likes: 0,
    message:
      "Pani Paulina spisała się znakomicie — mieszkanie po sprzątaniu wyglądało jak nowe, a jej sumienność i profesjonalne podejście naprawdę robią wrażenie."
  },
  {
    name: "Aleksander Twarościak",
    age: "4 tyg. temu",
    likes: 0,
    message:
      "Pani Paulina spisała się znakomicie — mieszkanie po sprzątaniu wyglądało jak nowe, a jej sumienność i profesjonalne podejście naprawdę robią wrażenie."
  }
] as const;

const cardStars = ["star-2.svg", "star-3.svg", "star-4.svg", "star-5.svg", "star-2.svg"] as const;

function ReviewFilter({ icon, label, wide }: { icon?: string; label: string; wide?: boolean }) {
  return (
    <div className={`reviews-filter${wide ? " is-wide" : ""}`}>
      {icon ? <img src={reviewAsset(icon)} alt="" /> : null}
      <span>{label}</span>
      <img className="reviews-filter-angle" src={reviewAsset("angle.svg")} alt="" />
    </div>
  );
}

function ReviewStars({ large = false }: { large?: boolean }) {
  const stars = large ? Array(5).fill("star-1.svg") : cardStars;

  return (
    <span className={`review-stars${large ? " is-large" : ""}`} aria-label="5 na 5 gwiazdek">
      {stars.map((star, index) => <img src={reviewAsset(star)} alt="" key={`${star}-${index}`} />)}
    </span>
  );
}

function RatingsSummary() {
  const rows = [
    { rating: 5, count: 7, percent: 86 },
    { rating: 4, count: 1, percent: 16 },
    { rating: 3, count: 0, percent: 0 },
    { rating: 2, count: 0, percent: 0 },
    { rating: 1, count: 0, percent: 0 }
  ];

  return (
    <div className="reviews-summary">
      <div className="reviews-score">
        <strong>4.7</strong>
        <ReviewStars large />
        <span>8 ocen</span>
      </div>
      <div className="ratings-distribution">
        {rows.map(row => (
          <div className="rating-row" key={row.rating}>
            <span className="rating-label"><img src={reviewAsset("star-outline.svg")} alt="" />{row.rating}</span>
            <span className="rating-track"><i style={{ width: `${row.percent}%` }} /></span>
            <span className="rating-count">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsOverview() {
  return (
    <section className="reviews-overview" aria-label="Filtry i podsumowanie ocen">
      <div className="reviews-toolbar">
        <div className="reviews-filters">
          <ReviewFilter icon="calendar-clock.svg" label="Wszystkie daty" wide />
          <ReviewFilter label="Wszystkie rodzaje usług" />
          <ReviewFilter icon="filter-star.svg" label="Wszystkie oceny" />
          <div className="reviews-reported"><img src={reviewAsset("flag.svg")} alt="" /><span>Zgłoszone</span></div>
        </div>
        <div className="reviews-search"><img src={reviewAsset("search.svg")} alt="" /><span>Nazwa użytkownika | słowo kluczowe</span></div>
      </div>
      <RatingsSummary />
    </section>
  );
}

function ReviewCard({ review }: { review: typeof reviews[number] }) {
  return (
    <article className="review-card">
      <img className="review-avatar" src={reviewAsset("reviewer-avatar.png")} alt="" />
      <div className="review-card-body">
        <div className="review-card-header">
          <div>
            <strong>{review.name}</strong>
            <span className="review-meta"><ReviewStars /><small>{review.age}</small></span>
          </div>
          <span className="review-actions">
            <span><img src={reviewAsset("heart.svg")} alt="Polubienia" />{review.likes}</span>
            <img src={reviewAsset("flag.svg")} alt="Zgłoś opinię" />
          </span>
        </div>
        <p>{review.message}</p>
      </div>
    </article>
  );
}

export function ProviderReviewsPage() {
  return (
    <ProviderShell active="Opinie" figmaNode="2102:2018">
      <section className="reviews-content">
        <img className="reviews-background" src={reviewAsset("background.png")} alt="" />
        <div className="reviews-column">
          <ReviewsOverview />
          <div className="reviews-list">
            {reviews.map(review => <ReviewCard review={review} key={review.name} />)}
          </div>
        </div>
      </section>
    </ProviderShell>
  );
}
