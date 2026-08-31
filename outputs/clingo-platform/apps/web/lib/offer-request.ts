import type { ProviderProfileData } from "../components/provider-profile-view";
import { serviceAreaStatus } from "../../api/src/dashboard/service-area";

export type OfferRequest = { area?: string; address?: string; pricing?: string; frequency?: string; addons?: string };
export type OfferRequestState = "missing" | "unknown-area" | "unsupported-location" | "ready";

export function pricingArea(pricing?: { label: string }) {
  const match = pricing?.label.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}

export function requestPricing<T extends { id: string; label: string }>(pricing: T[], area: string, pricingId?: string) {
  const selected = pricing.find(item => item.id === pricingId);
  const selectedArea = pricingArea(selected);
  if (selected && (!area || selectedArea === null || selectedArea === Number(area))) return selected;
  return pricing.find(item => pricingArea(item) === Number(area)) ?? pricing[0];
}

export function offerRequestState(profile: Pick<ProviderProfileData, "metrics" | "pricing">, area: string, address: string): OfferRequestState {
  const numericArea = Number(area);
  if (!area.trim() || !Number.isFinite(numericArea) || numericArea <= 0 || !address.trim()) return "missing";
  if (!profile.pricing?.some(pricing => pricingArea(pricing) === numericArea)) return "missing";
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
