import { ArrowRight, Check, Heart, MapPin, Star } from "lucide-react";
import { BoardListingData } from "../lib/public-mock-data";

function ListingAvatar({ tone }: { tone: BoardListingData["avatarTone"] }) {
  if (tone === "brand") {
    return (
      <div className="grid h-[74px] w-[74px] shrink-0 place-items-center rounded-full bg-[#facce2] text-[14px] font-extrabold text-[#53236e]">
        stepapp
      </div>
    );
  }

  if (tone === "neutral") {
    return <div className="h-[74px] w-[74px] shrink-0 rounded-full bg-gradient-to-br from-[#d9ecff] to-[#eef4fb]" />;
  }

  return (
    <div className="h-[74px] w-[74px] shrink-0 rounded-full bg-[radial-gradient(circle_at_50%_34%,#4a3124_0_13%,transparent_14%),radial-gradient(circle_at_50%_72%,#eac09c_0_31%,transparent_32%),linear-gradient(135deg,#f8decf,#fff2e9)]" />
  );
}

export function BoardListingCard({ listing }: { listing: BoardListingData }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#dce6f2] bg-white shadow-figma transition-all hover:-translate-y-0.5 hover:shadow-soft">
      <div className="grid gap-4 p-4 md:grid-cols-[auto_1fr_auto] md:p-5">
        <ListingAvatar tone={listing.avatarTone} />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[18px] font-bold text-clingo-ink">{listing.provider}</h3>
            <Check className="h-4 w-4 text-clingo-blue" />
            <span className="text-[12px] text-clingo-muted">{listing.completedOrders} wykonanych usług</span>
          </div>
          <p className="mt-1 text-[13px] text-clingo-muted">{listing.service}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-[#536479]">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-[#f2bd1d] text-[#f2bd1d]" />
              {listing.rating.toFixed(1)}
            </span>
            <span>({listing.reviews} ocen)</span>
            <span>Doświadczenie: {listing.experience}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px] text-clingo-muted">
            <MapPin className="h-4 w-4 text-clingo-blue" />
            {listing.location}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {listing.tags.map((tag) => (
              <span className="rounded-full bg-[#f3f6fa] px-3 py-1 text-[12px] text-[#66788e]" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 md:grid md:justify-items-end">
          <span
            aria-label={listing.favorite ? "Dodano do ulubionych" : "Ulubione"}
            className={[
              "grid h-[38px] w-[38px] place-items-center rounded-full transition-all",
              listing.favorite ? "bg-[#fff0f2] text-[#ed3d4d]" : "bg-[#f7f9fc] text-[#8392a5]"
            ].join(" ")}
          >
            <Heart className={listing.favorite ? "h-[15px] w-[15px] fill-current" : "h-[15px] w-[15px]"} />
          </span>
          <div className="text-right">
            <p className="text-[18px] font-bold text-clingo-ink">{listing.price}</p>
            <p className="mt-1 text-[12px] text-clingo-muted">Szacowana cena</p>
          </div>
        </div>
      </div>

      <footer className="flex h-[46px] items-center justify-between border-t border-[#e4ebf4] px-4 text-[13px] text-clingo-blue md:px-5">
        <span>Zamów usługę</span>
        <ArrowRight className="h-4 w-4" />
      </footer>
    </article>
  );
}
