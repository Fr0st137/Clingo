"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { BoardPayload } from "../lib/api";
import { numericArea } from "../lib/offer-request";
import { paginate, paginationSequence } from "../lib/pagination";
import { BoardFilters, type BoardAddOnFilter, type BoardFilterState } from "./board-filters";
import { BoardAddOnsOverlay } from "./board-addons-overlay";
import { BoardListingCard, type BoardListingData, type ListingRequest } from "./board-listing-card";
import { PublicSearchBar, type PublicSearchValues } from "./public-search-bar";

const initialFilters: BoardFilterState = {
  addOns: {},
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

  const selectedAddOns = Object.entries(filters.addOns).filter(([, selected]) => selected).map(([id]) => id);
  if (selectedAddOns.some(id => !listing.addOns?.some(addOn => addOn.id === id))) {
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

type BoardRequest = ListingRequest;

function cleanArea(value = "") {
  const parsed = numericArea(value);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "";
}

const legacyAddOnIds: Record<string, string> = {
  "mycie-okien": "window-cleaning",
  lodowka: "fridge-cleaning",
  naczynia: "dishes",
  piekarnik: "oven-cleaning",
  okap: "hood-cleaning",
  mikrofalowka: "microwave",
  "prasowanie-1": "ironing",
  "prasowanie-2": "ironing",
  szafa: "wardrobe-inside",
  szafki: "cabinet-inside",
  kuweta: "litter-box"
};

const addOnOrder = [
  "window-cleaning", "fridge-cleaning", "dishes", "oven-cleaning", "hood-cleaning",
  "microwave", "ironing", "wardrobe-inside", "cabinet-inside", "litter-box"
];

function parsedAddOnQuantities(value = "") {
  const quantities = new Map<string, number>();
  value.split(",").forEach(entry => {
    const [rawId, rawQuantity] = entry.split(":");
    const id = legacyAddOnIds[rawId] ?? rawId;
    const quantity = Math.max(1, Number(rawQuantity) || 1);
    if (id) quantities.set(id, (quantities.get(id) ?? 0) + quantity);
  });
  return quantities;
}

function serializedAddOns(selected: Record<string, boolean>, currentValue = "") {
  const quantities = parsedAddOnQuantities(currentValue);
  return Object.entries(selected)
    .filter(([, enabled]) => enabled)
    .map(([id]) => `${id}:${quantities.get(id) ?? 1}`)
    .join(",");
}

function serializedAddOnQuantities(quantities: Map<string, number>) {
  return [...quantities]
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => `${id}:${quantity}`)
    .join(",");
}

export function BoardInteractiveView({
  board,
  searchMarkup,
  initialRequest = {},
  initialPage = 1
}: {
  board: BoardPayload;
  searchMarkup: string;
  initialRequest?: BoardRequest;
  initialPage?: number;
}) {
  const router = useRouter();
  const [sortMode, setSortMode] = useState("default");
  const [addOnsPanelOpen, setAddOnsPanelOpen] = useState(false);
  const [requestedPage, setRequestedPage] = useState(() => Math.max(1, Math.trunc(initialPage) || 1));
  const initialValues = {
    service: initialRequest.service || "",
    area: cleanArea(initialRequest.area),
    location: initialRequest.address || ""
  };
  const [request, setRequest] = useState<BoardRequest>(() => ({
    service: initialValues.service,
    area: initialValues.area,
    address: initialValues.location,
    addons: initialRequest.addons || ""
  }));
  const additionalServices = useMemo(() => {
    const services = new Map<string, BoardAddOnFilter>();
    board.listings.forEach(listing => listing.addOns?.forEach(addOn => {
      if (!services.has(addOn.id)) {
        services.set(addOn.id, {
          id: addOn.id,
          label: addOn.label.replace(/\s*\(\d+\s*szt\.?\)\s*$/i, "")
        });
      }
    }));
    return [...services.values()].sort((first, second) => {
      const firstIndex = addOnOrder.indexOf(first.id);
      const secondIndex = addOnOrder.indexOf(second.id);
      if (firstIndex >= 0 || secondIndex >= 0) {
        return (firstIndex < 0 ? addOnOrder.length : firstIndex) - (secondIndex < 0 ? addOnOrder.length : secondIndex);
      }
      return first.label.localeCompare(second.label, "pl-PL");
    });
  }, [board.listings]);
  const [filters, setFilters] = useState<BoardFilterState>(() => {
    const selected = parsedAddOnQuantities(initialRequest.addons);
    return {
      ...initialFilters,
      addOns: Object.fromEntries([...selected.keys()].map(id => [id, true]))
    };
  });

  useEffect(() => {
    setRequest({ service: initialRequest.service || "", area: cleanArea(initialRequest.area),
      address: initialRequest.address || "", addons: initialRequest.addons || "" });
    setRequestedPage(Math.max(1, Math.trunc(initialPage) || 1));
    setFilters(current => ({ ...current, addOns: Object.fromEntries([...parsedAddOnQuantities(initialRequest.addons).keys()].map(id => [id, true])) }));
  }, [initialRequest.service, initialRequest.area, initialRequest.address, initialRequest.addons, initialPage]);

  const filteredListings = useMemo(
    () => sortListings(board.listings.filter((listing) => matchesFilters(listing, filters)), sortMode),
    [board.listings, filters, sortMode]
  );
  const visibleListingsCount = filteredListings.length;
  const page = paginate(filteredListings, requestedPage);
  const paginationItems = paginationSequence(page.currentPage, page.totalPages);

  function boardUrl(nextRequest: BoardRequest, nextPage: number) {
    const params = new URLSearchParams();
    if (nextRequest.service) params.set("service", nextRequest.service);
    if (nextRequest.area) params.set("area", nextRequest.area);
    if (nextRequest.address) params.set("address", nextRequest.address);
    if (nextRequest.addons) params.set("addons", nextRequest.addons);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return `/tablica-ogloszen${query ? `?${query}` : ""}`;
  }

  function changePage(nextPage: number) {
    const boundedPage = Math.min(page.totalPages, Math.max(1, nextPage));
    if (!page.totalPages || boundedPage === page.currentPage) return;
    setRequestedPage(boundedPage);
    router.replace(boardUrl(request, boundedPage), { scroll: false });
    window.requestAnimationFrame(() => {
      document.querySelector("[data-board-results]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function resetToFirstPage() {
    setRequestedPage(1);
    router.replace(boardUrl(request, 1), { scroll: false });
  }

  function submitSearch(values: PublicSearchValues) {
    const next: BoardRequest = {
      service: values.service?.trim() || "",
      area: cleanArea(values.area),
      address: values.location?.trim() || "",
      addons: values.addons || ""
    };
    setRequest(next);
    setFilters(current => ({ ...current, addOns: Object.fromEntries([...parsedAddOnQuantities(next.addons).keys()].map(id => [id, true])) }));
    setRequestedPage(1);
    router.replace(boardUrl(next, 1), { scroll: false });
  }

  function updateAddOnQuantity(id: string, quantity: number) {
    const quantities = parsedAddOnQuantities(request.addons);
    if (quantity > 0) quantities.set(id, Math.min(20, quantity));
    else quantities.delete(id);
    const addons = serializedAddOnQuantities(quantities);
    const nextRequest = { ...request, addons };
    setRequest(nextRequest);
    setFilters(current => ({
      ...current,
      addOns: Object.fromEntries([...quantities.keys()].map(addOnId => [addOnId, true]))
    }));
    setRequestedPage(1);
    router.replace(boardUrl(nextRequest, 1), { scroll: false });
  }

  return (
    <section className="w-full pb-[116px]" data-node-id="5263:9055">
      <PublicSearchBar markup={searchMarkup} addOns={additionalServices} initialValues={{ service: request.service || "", area: request.area || "", location: request.address || "", addons: request.addons || "" }} onSearch={submitSearch} />

      <div className="mt-[20px] grid w-[1440px] grid-cols-[345px_1075px] gap-[20px]" data-node-id="5263:9054">
        <BoardFilters
          addOnsOpen={addOnsPanelOpen}
          filteredCount={visibleListingsCount}
          filters={filters}
          groups={board.filters}
          onFiltersChange={(nextFilters) => {
            setFilters(nextFilters);
            const nextRequest = { ...request, addons: serializedAddOns(nextFilters.addOns, request.addons) };
            setRequest(nextRequest);
            setRequestedPage(1);
            router.replace(boardUrl(nextRequest, 1), { scroll: false });
          }}
          onToggleAddOns={() => setAddOnsPanelOpen(open => !open)}
          totalCount={board.listings.length}
        />

        <section className="relative min-h-[979px] w-[1075px] scroll-mt-[90px]" data-board-results data-node-id="5263:9053">
          {addOnsPanelOpen ? (
            <BoardAddOnsOverlay
              addOns={additionalServices}
              onChange={updateAddOnQuantity}
              onClose={() => setAddOnsPanelOpen(false)}
              quantities={parsedAddOnQuantities(request.addons)}
            />
          ) : null}
          <div aria-hidden={addOnsPanelOpen || undefined} inert={addOnsPanelOpen || undefined}>
          <header
            className="flex h-[60px] w-[1075px] items-center justify-between rounded-[20px] border border-[#e6edf3] bg-white px-[15px] shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]"
            data-node-id="1141:1478"
          >
            <label className="flex h-[28px] w-[230px] items-center text-[14px] font-normal leading-[28px] text-[#2e3b4c]">
              <span>Sortowanie:</span>
              <select
                className="ml-[6px] h-[28px] min-w-[128px] bg-transparent text-[14px] text-[#2e3b4c] outline-none"
                onChange={(event) => {
                  setSortMode(event.target.value);
                  resetToFirstPage();
                }}
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
                {page.currentPage}
              </span>
              <span className="ml-[8px]">z</span>
              <span className="ml-[8px]">{page.totalPages}</span>
              <img alt="" className="ml-[8px] h-[16px] w-[16px]" src="/figma-assets/board-arrow-right.svg" />
            </div>
          </header>

          <div className="mt-[20px] grid gap-[20px]" data-node-id="1163:1681">
            {page.items.length > 0 ? (
              page.items.map((listing) => <BoardListingCard listing={listing} key={listing.id} request={request} />)
            ) : (
              <div className="flex h-[172px] w-[1075px] items-center justify-center rounded-[20px] border border-[#e6edf3] bg-white text-[14px] text-[#7c8691] shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]">
                Brak ogłoszeń dla wybranych filtrów
              </div>
            )}
          </div>

          {page.totalPages > 0 ? <nav className="flex min-h-[58px] w-[1075px] items-center justify-center pt-[20px]" aria-label="Paginacja">
            <div className="flex min-h-[33px] items-center justify-center gap-[10px]">
              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <img alt="" className="h-[23px] w-[17px]" key={`ellipsis-${index}`} src="/figma-assets/board-pagination-dots.svg" />
                ) : (
                  <button
                    aria-current={item === page.currentPage ? "page" : undefined}
                    aria-label={`Strona ${item}`}
                    className={[
                      "flex h-[33px] w-[33px] items-center justify-center rounded-[30px] border border-[#e5e7eb] px-[9px] py-[7px] text-[14px] font-normal leading-5 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]",
                      item === page.currentPage ? "bg-[#f4f6f9] text-[#2e3b4c]" : "bg-white text-[#7c8691] hover:border-[#0079de] hover:text-[#0079de]"
                    ].join(" ")}
                    key={item}
                    onClick={() => changePage(item)}
                    type="button"
                  >
                    {item}
                  </button>
                )
              )}
              <button
                className="flex h-[33px] w-[108px] items-center justify-center gap-[5px] rounded-[30px] border border-[#e5e7eb] bg-[#f4f6f9] px-[12px] py-[9px] text-[14px] font-normal leading-5 text-[#2e3b4c] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={page.currentPage >= page.totalPages}
                onClick={() => changePage(page.currentPage + 1)}
                type="button"
              >
                Następna
                <img alt="" className="h-[12px] w-[15px] -rotate-90" src="/figma-assets/board-chevron.svg" />
              </button>
            </div>
          </nav> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
