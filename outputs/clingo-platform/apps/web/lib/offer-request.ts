import { parsedAddOnQuantities } from "./add-on-selection";
import type { ProviderProfileData } from "../components/provider-profile-view";
import { serviceAreaStatus } from "../../api/src/dashboard/service-area";
import { areaPricingOption } from "../../api/src/dashboard/area-pricing";
import { bookingMode, durationMinutes } from "../../api/src/dashboard/booking-policy";

export type OfferRequest = { area?: string; address?: string; pricing?: string; frequency?: string; access?: string; photoDraft?: string; addons?: string };
export type OfferRequestState = "missing" | "unknown-area" | "unsupported-location" | "ready";

export function numericArea(value: string) {
  const match = value.replace(",", ".").match(/[-+]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

export function pricingArea(pricing?: { label: string }) {
  const match = pricing?.label.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}

export function requestPricing<T extends { id: string; label: string }>(pricing: T[], area: string, pricingId?: string) {
  const selected = pricing.find(item => item.id === pricingId);
  if (selected && pricingArea(selected) === null) return selected;
  const requestedArea = numericArea(area);
  if (!Number.isFinite(requestedArea) || requestedArea <= 0) return selected ?? pricing[0];
  const tiers = pricing
    .map(item => ({ area: pricingArea(item), item }))
    .filter((entry): entry is { area: number; item: T } => entry.area !== null)
    .sort((first, second) => first.area - second.area);
  if (!tiers.length) return selected ?? pricing[0];
  return tiers.find(entry => entry.area >= requestedArea)?.item;
}

export function profilePricing(profile: Pick<ProviderProfileData, "pricing" | "areaPricing">, area: string, pricingId?: string) {
  return profile.areaPricing ? areaPricingOption(profile.areaPricing, `area-${numericArea(area)}`) : requestPricing(profile.pricing ?? [], area, pricingId);
}

export function profileBookingMode(profile: Pick<ProviderProfileData, "pricing" | "areaPricing" | "addOns" | "tags" | "bookingSettings">, selection: { pricingId?: string; addOns?: Array<{ id?: string; quantity?: number }>; splitIntoSessions?: boolean }) {
  const pricing = profile.areaPricing ? areaPricingOption(profile.areaPricing, selection.pricingId) : requestPricing(profile.pricing ?? [], "", selection.pricingId);
  const extra = (selection.addOns ?? []).reduce((sum, row) => sum + (profile.addOns?.find(item => item.id === row.id)?.durationMinutes ?? 0) * (row.quantity ?? 0), 0);
  return bookingMode(durationMinutes(pricing?.duration ?? "") + extra, profile, selection.splitIntoSessions, pricing && "estimatedWorkers" in pricing && typeof pricing.estimatedWorkers === "number" ? pricing.estimatedWorkers : undefined);
}

export function offerRequestState(profile: Pick<ProviderProfileData, "metrics" | "pricing" | "areaPricing">, area: string, address: string): OfferRequestState {
  const requestedArea = numericArea(area);
  if (!area.trim() || !Number.isFinite(requestedArea) || requestedArea <= 0 || !address.trim()) return "missing";
  if (!profilePricing(profile, area)) return "missing";
  const status = serviceAreaStatus(profile.metrics, address);
  if (status === "unknown") return "unknown-area";
  return status === "supported" ? "ready" : "unsupported-location";
}

export function offerAddOnQuantities(profile: Pick<ProviderProfileData, "addOns">, value = "") {
  const result: Record<string, number> = {};
  for (const [id, quantity] of parsedAddOnQuantities(value)) {
    if (profile.addOns?.some(item => item.id === id)) result[id] = quantity;
  }
  return result;
}
