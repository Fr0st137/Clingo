import { BoardFilters } from "../../components/board-filters";
import { BoardListingCard } from "../../components/board-listing-card";
import { PublicSearchBar } from "../../components/public-search-bar";
import { PublicShell } from "../../components/public-shell";
import { boardFilters, boardListings, boardSearchFields } from "../../lib/public-mock-data";

const paginationItems = ["1", "2", "3", "4", "...", "9"];

export default function BoardPage() {
  return (
    <PublicShell>
      <section className="w-[1440px] pb-[116px]" data-node-id="5263:9055">
        <PublicSearchBar fields={boardSearchFields} />

        <div className="mt-[20px] grid w-[1440px] grid-cols-[345px_1075px] gap-[20px]" data-node-id="5263:9054">
          <BoardFilters groups={boardFilters} />

          <section className="w-[1075px]" data-node-id="5263:9053">
            <header
              className="flex h-[60px] w-[1075px] items-center justify-between rounded-[20px] border border-[#e6edf3] bg-white px-[15px] shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]"
              data-node-id="1141:1478"
            >
              <button className="flex h-[28px] w-[172px] items-center text-[14px] font-normal leading-[28px] text-[#2e3b4c]" type="button">
                Sortowanie: Domyślne
                <img alt="" className="ml-[5px] h-[15px] w-[16px]" src="/figma-assets/board-chevron.svg" />
              </button>
              <div className="flex h-[30px] w-[95px] items-center text-[14px] font-normal leading-6 text-[#2e3b4c]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-[10px] border border-[#e5e7eb] bg-[#f4f6f9]">1</span>
                <span className="ml-[8px]">z</span>
                <span className="ml-[8px]">27</span>
                <img alt="" className="ml-[8px] h-[16px] w-[16px]" src="/figma-assets/board-arrow-right.svg" />
              </div>
            </header>

            <div className="mt-[20px] grid gap-[20px]" data-node-id="1163:1681">
              {boardListings.map((listing) => (
                <BoardListingCard listing={listing} key={listing.id} />
              ))}
            </div>

            <nav className="flex h-[58px] w-[1075px] items-center justify-center pt-[20px]" aria-label="Paginacja">
              <div className="flex h-[33px] w-[350px] items-center justify-center gap-[10px]">
                {paginationItems.map((item, index) =>
                  item === "..." ? (
                    <img alt="" className="h-[23px] w-[17px]" key={item} src="/figma-assets/board-pagination-dots.svg" />
                  ) : (
                    <button
                      className={[
                        "flex h-[33px] w-[33px] items-center justify-center rounded-[30px] border border-[#e5e7eb] px-[9px] py-[7px] text-[14px] font-normal leading-5 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]",
                        index === 0 ? "bg-[#f4f6f9] text-[#2e3b4c]" : "bg-white text-[#7c8691]"
                      ].join(" ")}
                      key={item}
                      type="button"
                    >
                      {item}
                    </button>
                  )
                )}
                <button className="flex h-[33px] w-[108px] items-center justify-center gap-[5px] rounded-[30px] border border-[#e5e7eb] bg-[#f4f6f9] px-[12px] py-[9px] text-[14px] font-normal leading-5 text-[#2e3b4c] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]">
                  Następna
                  <img alt="" className="h-[12px] w-[15px] -rotate-90" src="/figma-assets/board-chevron.svg" />
                </button>
              </div>
            </nav>
          </section>
        </div>
      </section>
    </PublicShell>
  );
}
