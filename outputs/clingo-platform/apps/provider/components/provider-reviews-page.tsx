"use client";

import { useMemo, useState } from "react";
import { ProviderShell } from "./provider-shell";
import { useSettingsResource } from "./provider-settings-state";
import { ApiError, normalized, providerApi } from "../lib/provider-client";

const reviewAsset = (name: string) => `/figma-assets/reviews/${name}`;

type ProviderReview = {
  id: string;
  authorName: string;
  serviceTitle: string;
  rating: number;
  content: string;
  helpfulCount: number;
  reported: boolean;
  revision: number;
  createdAt: string;
};

function ReviewStars({ rating, large = false }: { rating: number; large?: boolean }) {
  return <span className={`review-stars${large ? " is-large" : ""}`} aria-label={`${rating} na 5 gwiazdek`}>
    {[1, 2, 3, 4, 5].map(star => <img src={reviewAsset(star <= Math.round(rating) ? "star-1.svg" : "star-outline.svg")} alt="" key={star} />)}
  </span>;
}

function RatingsSummary({ reviews }: { reviews: ProviderReview[] }) {
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const rows = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(review => review.rating === rating).length;
    return { rating, count, percent: reviews.length ? count / reviews.length * 100 : 0 };
  });
  return <div className="reviews-summary">
    <div className="reviews-score"><strong>{average.toFixed(1)}</strong><ReviewStars rating={average} large /><span>{reviews.length} {reviews.length === 1 ? "ocena" : "ocen"}</span></div>
    <div className="ratings-distribution">{rows.map(row => <div className="rating-row" key={row.rating}><span className="rating-label"><img src={reviewAsset("star-outline.svg")} alt="" />{row.rating}</span><span className="rating-track"><i style={{ width: `${row.percent}%` }} /></span><span className="rating-count">{row.count}</span></div>)}</div>
  </div>;
}

function dateLabel(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  if (days === 0) return "dzisiaj";
  if (days === 1) return "wczoraj";
  if (days < 7) return `${days} dni temu`;
  if (days < 35) return `${Math.floor(days / 7)} tyg. temu`;
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function Reviews() {
  const resource = useSettingsResource<ProviderReview[]>("reviews");
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [service, setService] = useState("all");
  const [rating, setRating] = useState("all");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const reviews = resource.data ?? [];
  const services = useMemo(() => [...new Set(reviews.map(review => review.serviceTitle))].sort((a, b) => a.localeCompare(b, "pl")), [reviews]);
  const filtered = useMemo(() => {
    const threshold = dateRange === "all" ? 0 : Date.now() - Number(dateRange) * 86400000;
    const needle = normalized(query.trim());
    return reviews.filter(review => (!threshold || new Date(review.createdAt).getTime() >= threshold)
      && (service === "all" || review.serviceTitle === service)
      && (rating === "all" || review.rating === Number(rating))
      && (!reportedOnly || review.reported)
      && (!needle || normalized(`${review.authorName} ${review.serviceTitle} ${review.content}`).includes(needle)));
  }, [reviews, query, dateRange, service, rating, reportedOnly]);

  async function toggleReported(review: ProviderReview) {
    if (busyId) return;
    setBusyId(review.id); setError("");
    try {
      const saved = await providerApi<ProviderReview>(`reviews/${review.id}/report`, "PUT", { reported: !review.reported, revision: review.revision });
      resource.setData(previous => (previous ?? []).map(row => row.id === saved.id ? saved : row));
    } catch (caught) {
      setError((caught as Error).message);
      if (caught instanceof ApiError && caught.status === 409) resource.reload();
    } finally { setBusyId(""); }
  }

  if (resource.loading || resource.error) return <div className="provider-state" role={resource.error ? "alert" : "status"}>{resource.loading ? "Wczytywanie opinii..." : <><p>{resource.error}</p><button className="settings-button" onClick={resource.reload}>Spróbuj ponownie</button></>}</div>;
  return <section className="reviews-content reviews-live" aria-labelledby="reviews-title" data-figma-node="2102:2018">
    <img className="reviews-background" src={reviewAsset("background.png")} alt="" />
    <div className="reviews-column">
      <h1 id="reviews-title" className="sr-only">Opinie</h1>
      <section className="reviews-overview" aria-label="Filtry i podsumowanie ocen">
        <div className="reviews-toolbar">
          <div className="reviews-filters">
            <label className="reviews-filter is-wide"><img src={reviewAsset("calendar-clock.svg")} alt="" /><span className="sr-only">Zakres dat</span><select value={dateRange} onChange={event => setDateRange(event.target.value)}><option value="all">Wszystkie daty</option><option value="30">Ostatnie 30 dni</option><option value="90">Ostatnie 90 dni</option></select><img className="reviews-filter-angle" src={reviewAsset("angle.svg")} alt="" /></label>
            <label className="reviews-filter"><span className="sr-only">Rodzaj usługi</span><select value={service} onChange={event => setService(event.target.value)}><option value="all">Wszystkie rodzaje usług</option>{services.map(title => <option value={title} key={title}>{title}</option>)}</select><img className="reviews-filter-angle" src={reviewAsset("angle.svg")} alt="" /></label>
            <label className="reviews-filter"><img src={reviewAsset("filter-star.svg")} alt="" /><span className="sr-only">Ocena</span><select value={rating} onChange={event => setRating(event.target.value)}><option value="all">Wszystkie oceny</option>{[5, 4, 3, 2, 1].map(value => <option value={value} key={value}>{value} gwiazdek</option>)}</select><img className="reviews-filter-angle" src={reviewAsset("angle.svg")} alt="" /></label>
            <button type="button" className="reviews-reported" aria-pressed={reportedOnly} onClick={() => setReportedOnly(value => !value)}><img src={reviewAsset("flag.svg")} alt="" /><span>Zgłoszone</span></button>
          </div>
          <label className="reviews-search"><img src={reviewAsset("search.svg")} alt="" /><span className="sr-only">Szukaj opinii</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nazwa użytkownika | słowo kluczowe" /></label>
        </div>
        <RatingsSummary reviews={filtered} />
      </section>

      {error && <div className="provider-feedback is-error reviews-feedback" role="alert">{error}<button type="button" className="settings-button" onClick={resource.reload}>Odśwież</button></div>}
      <div className="reviews-list" aria-live="polite">
        {filtered.map(review => <article className={`review-card${review.reported ? " is-reported" : ""}`} key={review.id}>
          <img className="review-avatar" src={reviewAsset("reviewer-avatar.png")} alt="" />
          <div className="review-card-body">
            <div className="review-card-header"><div><strong>{review.authorName}</strong><span className="review-meta"><ReviewStars rating={review.rating} /><small>{dateLabel(review.createdAt)}</small><small className="review-service">{review.serviceTitle}</small></span></div><span className="review-actions"><span><img src={reviewAsset("heart.svg")} alt="" />{review.helpfulCount}<span className="sr-only"> polubień</span></span><button type="button" aria-label={review.reported ? `Cofnij zgłoszenie opinii ${review.authorName}` : `Zgłoś opinię ${review.authorName}`} aria-pressed={review.reported} disabled={busyId === review.id} onClick={() => toggleReported(review)}><img src={reviewAsset("flag.svg")} alt="" /></button></span></div>
            <p>{review.content}</p>
            {review.reported && <span className="review-reported-label">Opinia zgłoszona do moderacji</span>}
          </div>
        </article>)}
        {!filtered.length && <div className="reviews-empty" role="status">{reviews.length ? "Brak opinii pasujących do wybranych filtrów." : "Nie masz jeszcze żadnych opinii."}</div>}
      </div>
    </div>
  </section>;
}

export function ProviderReviewsPage() {
  return <ProviderShell active="Opinie" live figmaNode="2102:2018"><Reviews /></ProviderShell>;
}
