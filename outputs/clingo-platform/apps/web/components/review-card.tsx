import { Edit2, Plus, Star } from "lucide-react";
import { PendingReviewData, ReviewCardData } from "../lib/panel-mock-data";

function Avatar({ tone }: { tone: ReviewCardData["avatarTone"] }) {
  if (tone === "brand") {
    return (
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#facce2] text-[11px] font-extrabold text-[#53236e]">
        stepapp
      </div>
    );
  }

  return (
    <div className="h-12 w-12 shrink-0 rounded-full bg-[radial-gradient(circle_at_50%_34%,#553728_0_13%,transparent_14%),radial-gradient(circle_at_50%_72%,#efc49e_0_31%,transparent_32%),linear-gradient(135deg,#f7dbc9,#fff1e6)]" />
  );
}

function RatingStars({ rating = 5 }: { rating?: number }) {
  return (
    <span className="inline-flex items-center gap-[1px] text-[#f2bd1d]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star className={index < rating ? "h-[13px] w-[13px] fill-current" : "h-[13px] w-[13px]"} key={index} />
      ))}
    </span>
  );
}

export function PendingReviewCard({ item }: { item: PendingReviewData }) {
  return (
    <article className="flex min-h-[84px] w-full items-center gap-4 rounded-xl border border-[#dce6f2] bg-white p-4 shadow-figma transition-all hover:-translate-y-0.5 hover:shadow-soft md:max-w-[745px]">
      <Avatar tone={item.avatarTone} />
      <div className="min-w-0 flex-1">
        <h3 className="text-[14px] font-bold text-clingo-ink">{item.person}</h3>
        <p className="mt-1 truncate text-[12px] text-clingo-muted">{item.service}</p>
      </div>
      <button className="inline-flex h-[41px] items-center gap-2 rounded-full bg-clingo-blue px-5 text-[13px] font-bold text-white transition-all hover:bg-clingo-blueDark">
        Dodaj opinię
        <Plus className="h-4 w-4" />
      </button>
    </article>
  );
}

export function ReviewCard({ review, showAuthor = false }: { review: ReviewCardData; showAuthor?: boolean }) {
  return (
    <article className="w-full rounded-xl border border-[#dce6f2] bg-white p-4 shadow-figma transition-all hover:-translate-y-0.5 hover:shadow-soft md:max-w-[745px]">
      <div className="flex items-start gap-4">
        <Avatar tone={review.avatarTone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-[14px] font-bold text-clingo-ink">{review.person}</h3>
            {review.rating ? <RatingStars rating={review.rating} /> : null}
            {review.date ? <span className="text-[12px] text-clingo-muted">{review.date}</span> : null}
          </div>
          <p className="mt-1 text-[12px] text-clingo-muted">{review.service}</p>
        </div>

        {showAuthor ? (
          <div className="hidden min-w-[180px] text-[13px] text-clingo-ink md:block">
            <p>{review.author}</p>
            <div className="mt-1 flex items-center gap-2">
              <RatingStars rating={review.rating} />
              <span className="text-[12px] text-clingo-muted">{review.date}</span>
            </div>
          </div>
        ) : null}

        {review.editable ? (
          <button className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-[#e1e9f3] bg-[#f7f9fc] text-[#75859a] transition-all hover:border-clingo-blue hover:text-clingo-blue">
            <Edit2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {review.content ? <p className="mt-4 text-[13px] leading-6 text-[#2f4056]">{review.content}</p> : null}

      {review.images?.length ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {review.images.map((image, index) => (
            <div
              aria-label={image.label}
              className={[
                "h-[62px] w-[82px] rounded-xl border border-[#d9e4f0] bg-cover bg-center",
                index === 0 ? "bg-[linear-gradient(135deg,#c4b9a5,#f4e9d6)]" : "",
                index === 1 ? "bg-[linear-gradient(135deg,#d0d6d3,#8f9b94)]" : "",
                index === 2 ? "bg-[linear-gradient(135deg,#bca28b,#f2dfc7)]" : ""
              ].join(" ")}
              key={image.id}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
