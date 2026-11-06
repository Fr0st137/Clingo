import { calculateBookingQuote, BookingQuoteError, type BookingQuoteOffer } from "../../api/src/dashboard/booking-quote";
import { numericArea, requestPricing } from "./offer-request";
import { parsedAddOnQuantities } from "./add-on-selection";

export function quoteCatalogueListing(offer: BookingQuoteOffer, area = "", addons = "") {
  const pricingId = offer.areaPricing
    ? `area-${area ? numericArea(area) : offer.areaPricing.minimum}`
    : requestPricing(offer.pricing ?? [], area)?.id;
  if (!pricingId) return undefined;
  try {
    return calculateBookingQuote(offer, {
      pricingId,
      frequencyId: offer.frequencies?.find(row => row.id === "once")?.id ?? offer.frequencies?.[0]?.id,
      addOns: [...parsedAddOnQuantities(addons)].map(([id, quantity]) => ({ id, quantity }))
    });
  } catch (error) {
    if (error instanceof BookingQuoteError) return undefined;
    throw error;
  }
}
