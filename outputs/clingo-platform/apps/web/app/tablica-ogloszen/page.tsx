import { ChevronDown } from "lucide-react";
import { BoardFilters } from "../../components/board-filters";
import { BoardListingCard } from "../../components/board-listing-card";
import { PublicSearchBar } from "../../components/public-search-bar";
import { PublicShell } from "../../components/public-shell";
import { boardFilters, boardListings, boardSearchFields } from "../../lib/public-mock-data";

const paginationItems = ["1", "2", "3", "4", "...", "9"];

export default function BoardPage() {
  return (
    <PublicShell>
      <section className="grid gap-5 pb-12">
        <PublicSearchBar fields={boardSearchFields} />

        <div className="grid gap-5 md:grid-cols-[345px_minmax(0,1075px)]">
          <BoardFilters groups={boardFilters} />

          <section className="grid gap-5">
            <header className="flex min-h-[60px] flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dce6f2] bg-white px-5 shadow-figma">
              <button className="flex items-center gap-2 text-[14px] text-clingo-ink" type="button">
                Sortowanie: Domyślne
                <ChevronDown className="h-4 w-4 text-[#718198]" />
              </button>
              <div className="flex items-center gap-2 text-[14px] text-clingo-muted">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-clingo-blue text-white">1</span>
                <span>z</span>
                <span>27</span>
              </div>
            </header>

            <div className="grid gap-5">
              {boardListings.concat(boardListings).map((listing, index) => (
                <a className="block" href="/profil-ogloszeniowy/jednosesyjne" key={`${listing.id}-${index}`}>
                  <BoardListingCard listing={listing} />
                </a>
              ))}
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-[10px] py-6" aria-label="Paginacja">
              {paginationItems.map((item, index) => (
                <button
                  className={[
                    "h-[33px] min-w-[33px] rounded-xl px-3 text-[13px] transition-all",
                    index === 0 ? "bg-clingo-blue text-white" : "bg-white text-clingo-ink shadow-sm hover:text-clingo-blue"
                  ].join(" ")}
                  key={`${item}-${index}`}
                  type="button"
                >
                  {item}
                </button>
              ))}
              <button className="h-[33px] rounded-xl bg-white px-4 text-[13px] text-clingo-ink shadow-sm transition-all hover:text-clingo-blue">
                Następna
              </button>
            </nav>
          </section>
        </div>
      </section>
    </PublicShell>
  );
}
