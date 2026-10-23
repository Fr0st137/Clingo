import type { ProviderProfileData } from "../components/provider-profile-view";
import { serviceAreaStatus } from "../../api/src/dashboard/service-area";
import { areaPricingOption } from "../../api/src/dashboard/area-pricing";

export type OfferRequest = { area?: string; address?: string; pricing?: string; frequency?: string; addons?: string };
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
  for (const entry of value.split(",")) {
    const [id, rawQuantity] = entry.split(":");
    const quantity = Number(rawQuantity);
    if (profile.addOns?.some(item => item.id === id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 20) result[id] = quantity;
  }
  return result;
}
