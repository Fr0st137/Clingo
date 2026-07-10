import { BoardListingData } from "../lib/public-mock-data";

function ListingImage({ listing }: { listing: BoardListingData }) {
  const isContain = listing.imageFit === "contain";

  return (
    <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[20px] bg-[#ffd6e6] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.15)]">
      <img
        alt=""
        className={["absolute inset-0 h-full w-full", isContain ? "object-contain" : "object-cover"].join(" ")}
        src={listing.image}
        style={listing.imageScale ? { height: "24.84%", left: "5.12%", top: "37.14%", width: listing.imageScale } : undefined}
      />
    </div>
  );
}

function Rating({ rating, reviews, experience }: { rating: number; reviews: number; experience: string }) {
  return (
    <div className="flex h-[24px] items-center gap-[5px] pt-px text-[14px] leading-6">
      <span className="flex h-[24px] w-[18px] items-center justify-center">
        <img alt="" className="h-[14px] w-[16px]" src="/figma-assets/board-rating-star.svg" />
      </span>
      <span className="h-[24px] w-[25px] font-semibold text-[#2e3b4c]">{rating.toFixed(1)}</span>
      <span className="font-normal text-[#0079de]">({reviews} ocen)</span>
      {experience ? <span className="font-normal text-[#2e3b4c]">Doświadczenie: {experience}</span> : null}
    </div>
  );
}

export function BoardListingCard({ listing }: { listing: BoardListingData }) {
  const modeClasses =
    listing.modeTone === "blue" ? "bg-[#e9f5ff] text-[#0079de]" : "bg-[#f4f6f9] text-[#2e3b4c]";

  return (
    <article
      className="flex h-[172px] w-[1075px] flex-col items-start overflow-hidden rounded-[20px] border border-[#e6edf3] bg-white shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]"
      data-name="Ogłoszenie na tablicy"
    >
      <div className="flex w-full items-start gap-[40px] overflow-hidden p-[15px]">
        <ListingImage listing={listing} />

        <div className="flex w-[541px] shrink-0 flex-col items-start gap-[10px] overflow-hidden pt-[5px]">
          <h3 className="m-0 h-[24px] w-[541px] whitespace-nowrap text-[20px] font-semibold leading-normal text-[#2e3b4c]">
            {listing.provider}
          </h3>
          <Rating rating={listing.rating} reviews={listing.reviews} experience={listing.experience} />
          <div className="flex items-start gap-[15px] overflow-hidden">
            <span className={`flex items-center rounded-[9999px] px-[10px] py-[4px] text-[14px] font-normal leading-normal ${modeClasses}`}>
              {listing.mode}
            </span>
            <span className="flex items-center justify-center gap-[8px] py-[4px] text-[14px] font-normal leading-normal text-[#2e3b4c]">
              <img alt="" className="h-[14px] w-[14px]" src="/figma-assets/board-check.svg" />
              {listing.completedOrders} Wykonanych usług
            </span>
          </div>
        </div>

        <div className="flex w-[242px] shrink-0 self-stretch flex-col items-start justify-center gap-[5px] pl-[10px]">
          <div className="flex w-full flex-col items-start justify-center overflow-hidden rounded-[15px] px-[15px] py-[5px]">
            <p className="m-0 w-full text-[20px] font-semibold leading-6 text-[#2e3b4c]">{listing.price}</p>
          </div>
          <p className="m-0 w-full px-[15px] pr-[5px] text-[12px] font-medium leading-[14px] text-[#9ca3af]">
            Koszt w danej konfiguracji
          </p>
          <p className="m-0 flex w-full items-center gap-[10px] px-[15px] pr-[5px] text-[12px] font-medium leading-[14px] text-[#9ca3af]">
            <img alt="" className="h-[12px] w-[12px]" src="/figma-assets/board-truck.svg" />
            Dojazd uwzględniony w cenie
          </p>
        </div>

        <button
          aria-label="Ulubione"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[30px] border border-[#e6edf3] bg-[#f9fafb] p-[11px]"
          type="button"
        >
          <img alt="" className="h-[16px] w-[16px]" src="/figma-assets/board-heart.svg" />
        </button>
      </div>

      <a
        className="flex h-[48px] w-full shrink-0 items-center justify-between overflow-hidden border-t border-[#e6edf3] px-[15px] py-[10px]"
        href="/zamowienie"
      >
        <span className="text-[12px] font-normal leading-normal text-[#9ca3af]">Zamów usługę</span>
        <span className="flex items-center justify-center overflow-hidden rounded-[30px] px-[10px] py-[2px]">
          <img alt="" className="h-[14px] w-[14px]" src="/figma-assets/board-arrow-right.svg" />
        </span>
      </a>
    </article>
  );
}
