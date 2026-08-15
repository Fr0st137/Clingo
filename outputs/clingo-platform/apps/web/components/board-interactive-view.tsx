"use client";

import { useMemo, useState } from "react";
import type { BoardPayload } from "../lib/api";
import { BoardFilters, type BoardFilterState } from "./board-filters";
import { BoardListingCard, type BoardListingData } from "./board-listing-card";
import { PublicSearchBar } from "./public-search-bar";

const paginationItems = ["1", "2", "3", "4", "...", "9"];

const initialFilters: BoardFilterState = {
  facilities: {},
  maxPrice: "",
  minOrders: 0,
  minPrice: "",
  minRating: null,
  modes: {
    Jednosesyjne: true,
    Wielosesyjne: true
  }
};

function priceNumber(value: string) {
  return Number(value.replace(",", ".").replace(/[^\d.]/g, "") || 0);
}

function matchesFilters(listing: BoardListingData, filters: BoardFilterState) {
  const price = priceNumber(listing.price);
  const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;

  if (filters.minRating !== null && listing.rating < filters.minRating) {
    return false;
  }

  if (minPrice !== null && price < minPrice) {
    return false;
  }

  if (maxPrice !== null && price > maxPrice) {
    return false;
  }

  if (!filters.modes[listing.mode]) {
    return false;
  }

  if (listing.completedOrders < filters.minOrders) {
    return false;
  }

  return true;
}

function sortListings(listings: BoardListingData[], sortMode: string) {
  const sorted = [...listings];

  if (sortMode === "rating") {
    sorted.sort((first, second) => second.rating - first.rating);
  } else if (sortMode === "price-asc") {
    sorted.sort((first, second) => priceNumber(first.price) - priceNumber(second.price));
  } else if (sortMode === "orders") {
    sorted.sort((first, second) => second.completedOrders - first.completedOrders);
  }

  return sorted;
}

export function BoardInteractiveView({ board }: { board: BoardPayload }) {
  const [filters, setFilters] = useState<BoardFilterState>(initialFilters);
  const [sortMode, setSortMode] = useState("default");

  const filteredListings = useMemo(
    () => sortListings(board.listings.filter((listing) => matchesFilters(listing, filters)), sortMode),
    [board.listings, filters, sortMode]
  );
  const visibleListingsCount = filteredListings.length;

  return (
    <section className="w-[1440px] pb-[116px]" data-node-id="5263:9055">
      <PublicSearchBar fields={board.searchFields} />

      <div className="mt-[20px] grid w-[1440px] grid-cols-[345px_1075px] gap-[20px]" data-node-id="5263:9054">
        <BoardFilters
          filteredCount={visibleListingsCount}
          filters={filters}
          groups={board.filters}
          onFiltersChange={setFilters}
          totalCount={board.listings.length}
        />

        <section className="w-[1075px]" data-node-id="5263:9053">
          <header
            className="flex h-[60px] w-[1075px] items-center justify-between rounded-[20px] border border-[#e6edf3] bg-white px-[15px] shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]"
            data-node-id="1141:1478"
          >
            <label className="flex h-[28px] w-[230px] items-center text-[14px] font-normal leading-[28px] text-[#2e3b4c]">
              <span>Sortowanie:</span>
              <select
                className="ml-[6px] h-[28px] min-w-[128px] bg-transparent text-[14px] text-[#2e3b4c] outline-none"
                onChange={(event) => setSortMode(event.target.value)}
                value={sortMode}
              >
                <option value="default">Domyślne</option>
                <option value="rating">Ocena</option>
                <option value="price-asc">Cena rosnąco</option>
                <option value="orders">Wykonane usługi</option>
              </select>
            </label>
            <div className="flex h-[30px] w-[95px] items-center text-[14px] font-normal leading-6 text-[#2e3b4c]">
              <span className="grid h-[30px] w-[30px] place-items-center rounded-[10px] border border-[#e5e7eb] bg-[#f4f6f9]">
                {visibleListingsCount > 0 ? 1 : 0}
              </span>
              <span className="ml-[8px]">z</span>
              <span className="ml-[8px]">{visibleListingsCount}</span>
              <img alt="" className="ml-[8px] h-[16px] w-[16px]" src="/figma-assets/board-arrow-right.svg" />
            </div>
          </header>

          <div className="mt-[20px] grid gap-[20px]" data-node-id="1163:1681">
            {filteredListings.length > 0 ? (
              filteredListings.map((listing) => <BoardListingCard listing={listing} key={listing.id} />)
            ) : (
              <div className="flex h-[172px] w-[1075px] items-center justify-center rounded-[20px] border border-[#e6edf3] bg-white text-[14px] text-[#7c8691] shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]">
                Brak ogłoszeń dla wybranych filtrów
              </div>
            )}
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
  );
}
