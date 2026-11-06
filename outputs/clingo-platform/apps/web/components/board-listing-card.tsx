"use client";
import { FavoriteButton } from "./favorite-button";

import Link from "next/link";
import Image from "next/image";

import { useState } from "react";

export interface BoardListingData {
  service?: string;
  serviceCategory?: string;
  serviceMetrics?: Array<{ id: string; label: string; value: string }>;
  areaPricing?: import("../../api/src/dashboard/area-pricing").AreaPricing | null;
  pricing?: Array<{ id: string; label: string; priceValue: number; duration: string }> | null;
  frequencies?: Array<{ id: string; label: string; discount: string }> | null;
  bookingSettings?: import("../../api/src/dashboard/booking-policy").WorkingHours | null;
  tags?: string[];
  addOns?: Array<{ id: string; label: string; durationMinutes: number; priceValue: number }>;
  id: string;
  provider: string;
  rating: number;
  reviews: number;
  experience: string;
  price: string;
  completedOrders: number;
  mode: "Jednosesyjne" | "Wielosesyjne";
  modeTone: "blue" | "gray";
  image: string;
  imageFit?: "cover" | "contain";
  imageScale?: string;
}

export type ListingRequest = { area?: string; address?: string; service?: string; addons?: string };

function withRequest(path: string, request: ListingRequest) {
  const params = new URLSearchParams();
  if (request.area) params.set("area", request.area);
  if (request.address) params.set("address", request.address);
  if (request.service) params.set("service", request.service);
  if (request.addons) params.set("addons", request.addons);
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

function ListingImage({ listing }: { listing: BoardListingData }) {
  const isContain = listing.imageFit === "contain";

  return (
    <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[20px] bg-[#ffd6e6] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.15)] sm:h-[104px] sm:w-[104px]">
      <Image width={104} height={104} sizes="104px"
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
    <div className="flex flex-wrap items-center gap-[5px] pt-px text-[14px] leading-6 min-[1440px]:h-[24px] min-[1440px]:flex-nowrap">
      <span className="flex h-[24px] w-[18px] items-center justify-center">
        <img alt="" className="h-[14px] w-[16px]" src="/figma-assets/board-rating-star.svg" />
      </span>
      <span className="h-[24px] w-[25px] font-semibold text-[#2e3b4c]">{rating.toFixed(1)}</span>
      <span className="font-normal text-[#0079de]">({reviews} ocen)</span>
      {experience ? <span className="basis-full font-normal text-[#2e3b4c] min-[1440px]:basis-auto">Doświadczenie: {experience}</span> : null}
    </div>
  );
}

export function BoardListingCard({ listing, request = {} }: { listing: BoardListingData; request?: ListingRequest }) {
  const modeClasses =
    listing.modeTone === "blue" ? "bg-[#e9f5ff] text-[#0079de]" : "bg-[#f4f6f9] text-[#2e3b4c]";

  return (
    <article
      className="flex min-h-[172px] w-full min-w-0 flex-col items-start overflow-hidden rounded-[20px] border border-[#e6edf3] bg-white shadow-[0px_2px_14px_0px_rgba(0,0,0,0.04)]"
      data-name="Ogłoszenie na tablicy"
    >
      <div className="grid w-full min-w-0 grid-cols-[80px_minmax(0,1fr)_40px] items-start gap-[12px] p-[15px] sm:grid-cols-[104px_minmax(0,1fr)_40px] min-[1440px]:flex min-[1440px]:gap-[40px]">
        <Link aria-label={`Profil wykonawcy ${listing.provider}`} href={withRequest(`/wykonawcy/${listing.id}`, request)}>
          <ListingImage listing={listing} />
        </Link>

        <div className="flex min-w-0 flex-col items-start gap-[10px] pt-[5px] min-[1440px]:flex-1">
          <h3 className="m-0 w-full break-words text-[20px] font-semibold leading-normal text-[#2e3b4c] min-[1440px]:h-[24px] min-[1440px]:truncate" title={listing.service ? `${listing.provider} — ${listing.service}` : listing.provider}>
            <Link href={withRequest(`/wykonawcy/${listing.id}`, request)}>{listing.provider}</Link>
          </h3>
          {listing.id.startsWith("service-") && listing.service && <p className="m-0 w-full break-words text-[13px] text-[#536479] min-[1440px]:truncate">{listing.service}</p>}
          <Rating rating={listing.rating} reviews={listing.reviews} experience={listing.experience} />
          <div className="flex flex-wrap items-start gap-[10px] min-[1440px]:flex-nowrap min-[1440px]:gap-[15px]">
            <span className={`flex items-center rounded-[9999px] px-[10px] py-[4px] text-[14px] font-normal leading-normal ${modeClasses}`}>
              {listing.mode}
            </span>
            <span className="flex items-center justify-center gap-[8px] py-[4px] text-[14px] font-normal leading-normal text-[#2e3b4c]">
              <img alt="" className="h-[14px] w-[14px]" src="/figma-assets/board-check.svg" />
              {listing.completedOrders} Wykonanych usług
            </span>
          </div>
        </div>

        <div className="col-span-3 col-start-1 row-start-2 flex min-w-0 self-stretch flex-col items-start justify-center gap-[5px] min-[1440px]:w-[242px] min-[1440px]:shrink-0 min-[1440px]:pl-[10px]">
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

        <div className="col-start-3 row-start-1"><FavoriteButton providerId={listing.id} /></div>
      </div>

      <Link
        className="flex h-[48px] w-full shrink-0 items-center justify-between overflow-hidden border-t border-[#e6edf3] px-[15px] py-[10px]"
        href={withRequest(`/profil-ogloszeniowy/${listing.id}`, request)}
      >
        <span className="text-[12px] font-normal leading-normal text-[#9ca3af]">Zamów usługę</span>
        <span className="flex items-center justify-center overflow-hidden rounded-[30px] px-[10px] py-[2px]">
          <img alt="" className="h-[14px] w-[14px]" src="/figma-assets/board-arrow-right.svg" />
        </span>
      </Link>
    </article>
  );
}
