"use client";

import { BarChart3, Check, ChevronDown, Heart, MapPin, Share2, Truck, UserRound } from "lucide-react";
import { useState } from "react";
import type { ProviderProfileData } from "./provider-profile-view";

const availability = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];

const paulinaServices = [
  {
    id: "homes",
    label: "Sprzątanie obiektów",
    category: "Mieszkań i domów",
    completed: 18,
    price: "1,50 zł / m²"
  },
  {
    id: "offices",
    label: "Sprzątanie obiektów",
    category: "Biur i lokali użytkowych",
    completed: 13,
    price: "1,20 zł / m²"
  }
];

function providerImage(id: string) {
  if (id === "stepapp") {
    return { fit: "object-contain", src: "/figma-assets/board-stepapp-logo.png" };
  }

  if (id === "mobimop") {
    return { fit: "object-contain", src: "/figma-assets/board-mobimop-logo.png" };
  }

  return { fit: "object-cover", src: "/figma-assets/board-avatar-paulina.png" };
}

function cityFromLocation(location: string) {
  return location.split(",")[0]?.trim() || location;
}

function StarRow({ rating, size = "small" }: { rating: number; size?: "small" | "large" }) {
  return (
    <span className="inline-flex items-center" aria-label={`Ocena ${rating} na 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <img
          alt=""
          className={size === "large" ? "h-[16px] w-[18px]" : "h-[14px] w-[16px]"}
          key={index}
          src="/figma-assets/board-rating-star.svg"
          style={{ opacity: index < Math.round(rating) ? 1 : 0.22 }}
        />
      ))}
    </span>
  );
}

function ProfileSummary({ profile }: { profile: ProviderProfileData }) {
  const [favorite, setFavorite] = useState(false);
  const [shared, setShared] = useState(false);
  const image = providerImage(profile.id);

  const shareProfile = async () => {
    const shareData = {
      text: `Zobacz profil ${profile.provider} w Clingo`,
      title: `${profile.provider} | Clingo`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch {
      setShared(false);
    }
  };

  return (
    <article className="relative flex min-h-[180px] min-w-0 flex-col items-start gap-[20px] overflow-hidden rounded-[30px] border border-[#e6edf3] bg-white p-[20px] shadow-[0_2px_14px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:gap-[30px] sm:p-[30px]">
      <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[20px] bg-[#f4f6f9] shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] sm:h-[120px] sm:w-[120px]">
        <img alt={profile.provider} className={`h-full w-full ${image.fit}`} src={image.src} />
      </div>

      <div className="min-w-0 w-full sm:pr-[76px]">
        <h1 className="m-0 pr-[76px] text-[26px] font-bold leading-[34px] text-[#2e3b4c] sm:truncate sm:pr-0 sm:text-[32px] sm:leading-[39px]">{profile.provider}</h1>
        <div className="mt-[11px] flex flex-wrap items-center gap-1 text-[14px] leading-6 text-[#2e3b4c]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-[13px] w-[13px]" strokeWidth={1.8} />
            {cityFromLocation(profile.location)} <span aria-hidden="true">|</span>
          </span>
          <span className="font-medium">Dostępność</span>
          <span className="ml-1 flex flex-wrap gap-2">
            {availability.map((day) => (
              <span className="grid h-[26px] w-[30px] place-items-center rounded-[8px] bg-[#f4f6f9] text-[#7c8691]" key={day}>
                {day}
              </span>
            ))}
          </span>
        </div>
        <div className="mt-[11px] flex flex-wrap items-center gap-[10px] text-[14px] text-[#2e3b4c]">
          <span className="rounded-full bg-[#f4f6f9] px-[12px] py-[5px]">2 Pracowników</span>
          <span className="inline-flex items-center gap-2 py-1">
            <Check className="h-[14px] w-[14px] text-[#0079de]" strokeWidth={2.2} />
            {profile.completedOrders} Wykonanych usług
          </span>
        </div>
      </div>

      <div className="absolute right-[29px] top-[31px] flex gap-[15px]">
        <button
          aria-label={shared ? "Link skopiowany" : "Udostępnij profil"}
          className="grid h-[38px] w-[38px] place-items-center rounded-full border border-[#e6edf3] bg-[#f9fafb] text-[#2e3b4c]"
          onClick={shareProfile}
          title={shared ? "Link skopiowany" : "Udostępnij profil"}
          type="button"
        >
          <Share2 className="h-4 w-4" strokeWidth={1.7} />
        </button>
        <button
          aria-label="Dodaj do ulubionych"
          aria-pressed={favorite}
          className="grid h-[38px] w-[38px] place-items-center rounded-full border border-[#e6edf3] bg-[#f9fafb]"
          onClick={() => setFavorite((current) => !current)}
          type="button"
        >
          <Heart className={`h-4 w-4 ${favorite ? "fill-[#0079de] text-[#0079de]" : "text-[#2e3b4c]"}`} strokeWidth={1.7} />
        </button>
      </div>
    </article>
  );
}

function ServiceCard({
  category,
  completed,
  href,
  label,
  price
}: {
  category: string;
  completed: number;
  href: string;
  label: string;
  price: string;
}) {
  return (
    <article className="flex min-h-[145px] min-w-0 flex-col items-stretch gap-[15px] overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white p-[20px] shadow-[0_4px_14px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:gap-[10px] sm:p-[25px]">
      <div className="grid h-[82px] w-[82px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white sm:h-[95px] sm:w-[95px]">
        <img alt="" className="h-[80px] w-[80px] object-contain sm:h-[92px] sm:w-[92px]" src="/clingo-homepage/assets/icons/service-broom-1.png" />
      </div>
      <div className="grid min-w-0 flex-1 gap-[10px]">
        <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
          <div className="min-w-0">
            <h3 className="m-0 text-[18px] font-semibold leading-[22px] text-[#2e3b4c] sm:truncate">{label}</h3>
            <p className="m-0 mt-[5px] text-[14px] leading-[17px] text-[#2e3b4c] sm:truncate">{category}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-[10px] text-[14px] text-[#2e3b4c]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e9f5ff]">
              <Check className="h-3 w-3 text-[#0079de]" strokeWidth={2.2} />
            </span>
            {completed} Realizacji
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-wrap items-center gap-[15px]">
            <span className="inline-flex h-[29px] items-center gap-[10px] rounded-full bg-[#f4f6f9] px-[12px] text-[14px] text-[#2e3b4c]">
              <BarChart3 className="h-[14px] w-[14px]" strokeWidth={1.6} />
              {price}
            </span>
            <span className="inline-flex h-[29px] items-center gap-[10px] rounded-full bg-[#f4f6f9] px-[12px] text-[14px] text-[#2e3b4c]">
              <Truck className="h-[14px] w-[14px]" strokeWidth={1.6} />
              0 zł / km
            </span>
          </div>
          <a className="flex h-[41px] w-full shrink-0 items-center justify-center rounded-full bg-[#0079de] text-[14px] font-medium text-white sm:w-[187px]" href={href}>
            Przejdź do ogłoszenia
          </a>
        </div>
      </div>
    </article>
  );
}

function RatingsCard({ profile }: { profile: ProviderProfileData }) {
  const total = Math.max(profile.reviewsCount, 1);
  const fourStar = total > 1 ? 1 : 0;
  const distribution = [total - fourStar, fourStar, 0, 0, 0];

  return (
    <section className="min-h-[180px] rounded-[30px] border border-[#e6edf3] bg-white p-[24px] shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
      <div className="flex h-6 items-center gap-[10px]">
        <strong className="text-[20px] leading-6 text-[#2e3b4c]">{profile.rating.toFixed(1)}</strong>
        <StarRow rating={profile.rating} size="large" />
        <span className="text-[14px] text-[#0079de]">{profile.reviewsCount} ocen</span>
      </div>
      <div className="mt-2 grid gap-[5px]">
        {distribution.map((count, index) => {
          const score = 5 - index;
          const width = `${Math.max(0, Math.min(100, (count / total) * 100))}%`;

          return (
            <div className="grid grid-cols-[25px_1fr_12px] items-center gap-[10px] text-[13px] leading-4 text-[#334155]" key={score}>
              <span className="inline-flex items-center gap-[5px]">
                <img alt="" className="h-3 w-3" src="/figma-assets/board-rating-star.svg" />
                {score}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                <span className="block h-full rounded-full bg-[#facc15]" style={{ width }} />
              </span>
              <span className="text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReviewItem({ review, expandable = false }: { expandable?: boolean; review: ProviderProfileData["reviews"][number] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-[30px] border border-[#e6edf3] bg-white/40 p-[25px]">
      <div className="flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#c7c8c8] text-white">
          <UserRound className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[16px] font-medium leading-6 text-[#2e3b4c]">{review.author}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <StarRow rating={review.rating} />
            <span className="text-[14px] leading-5 text-[#334155]">{review.date}</span>
          </div>
          <p className="m-0 mt-2 text-[14px] leading-[26px] text-[#334155]">
            {expandable && !expanded && review.content.length > 142 ? `${review.content.slice(0, 142).trim()}...` : review.content}
          </p>
        </div>
      </div>
      {expandable && review.content.length > 142 ? (
        <button className="ml-auto mt-[10px] flex h-7 items-center gap-[5px] px-[30px] text-[14px] font-medium text-[#0079de]" onClick={() => setExpanded((value) => !value)} type="button">
          {expanded ? "Mniej" : "Więcej"}
          <ChevronDown className={`h-[17px] w-[17px] transition-transform ${expanded ? "rotate-180" : ""}`} strokeWidth={1.8} />
        </button>
      ) : null}
    </article>
  );
}

export function PublicProviderProfileView({ profile }: { profile: ProviderProfileData }) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const services = profile.id === "paulina-jagielska" ? paulinaServices : paulinaServices.map((service, index) => ({
    ...service,
    category: index === 0 ? profile.service.split("·").pop()?.trim() || profile.service : "Usługi dodatkowe",
    completed: index === 0 ? profile.completedOrders : Math.max(0, Math.round(profile.completedOrders / 2)),
    price: index === 0 ? profile.priceFrom.replace("od ", "") : service.price
  }));
  const visibleReviews = showAllReviews ? profile.reviews : profile.reviews.slice(0, 2);

  return (
    <section className="mx-auto grid w-full max-w-[1200px] items-start gap-[20px] pb-[155px] xl:grid-cols-[720px_460px]" data-node-id="6149:10751">
      <div className="grid min-w-0 gap-[20px]">
        <ProfileSummary profile={profile} />
        <h2 className="m-0 text-[20px] font-bold leading-6 text-[#2e3b4c]">Wykonywane usługi</h2>
        <div className="grid gap-[20px]">
          {services.map((service) => (
            <ServiceCard {...service} href={`/profil-ogloszeniowy/${profile.id}?service=${service.id}`} key={service.id} />
          ))}
        </div>
      </div>

      <aside className="grid min-w-0 gap-[20px]">
        <RatingsCard profile={profile} />
        {visibleReviews.map((review, index) => (
          <ReviewItem expandable={index === 0} key={review.id} review={review} />
        ))}
        {profile.reviews.length > 2 ? (
          <button className="flex h-[38px] w-fit items-center gap-[5px] px-[30px] text-[14px] font-medium text-[#0079de]" onClick={() => setShowAllReviews((value) => !value)} type="button">
            {showAllReviews ? "Pokaż mniej opinii" : "Zobacz więcej opinii"}
            <ChevronDown className={`h-[17px] w-[17px] transition-transform ${showAllReviews ? "rotate-180" : ""}`} strokeWidth={1.8} />
          </button>
        ) : null}
      </aside>
    </section>
  );
}
