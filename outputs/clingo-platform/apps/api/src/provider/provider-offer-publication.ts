import { BadRequestException } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { areaPricingOption } from "../dashboard/area-pricing";
import { BoardListingEntity } from "../dashboard/board-listing.entity";
import { defaultWorkingHours, money } from "../dashboard/booking";
import { ProviderProfileEntity } from "../dashboard/provider-profile.entity";
import { ProviderAccountEntity } from "./provider.entity";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { bookingMode, sessionCapacity } from "../dashboard/booking-policy";

export const publicOfferId = (id: string) => `service-${id}`;

// The caller holds the organisation lock, shared with customer/manual bookings.
export async function publishOffer(manager: EntityManager, offer: ProviderOfferEntity, account: ProviderAccountEntity) {
  const id = publicOfferId(offer.id);
  const old = await manager.findOneBy(ProviderProfileEntity, { id });
  if (offer.status !== "published") {
    if (old) await manager.update(ProviderProfileEntity, { id, accountId: account.id }, { published: false });
    return;
  }
  const config = offer.configuration;
  if (!offer.description.trim()) throw new BadRequestException("Przed publikacją dodaj opis i zakres usługi.");
  if (!config.standardsAccepted) throw new BadRequestException("Przed publikacją zaakceptuj standard wykonania usługi.");
  if (!account.location?.city?.trim()) throw new BadRequestException("Przed publikacją uzupełnij miejscowość w ustawieniach lokalizacji działalności.");
  const minimum = config.areaTiers[0].minSquareMeters;
  const maximum = config.areaTiers.at(-1)!.maxSquareMeters ?? 10000;
  const areaPricing = { rateMinor: config.ratePerSquareMeterMinor, minutesPer100: config.durationPer100SquareMetersMinutes, minimum, maximum, workerTiers: config.areaTiers, maxSessionMinutes: sessionCapacity() };
  const pricing = areaPricingOption(areaPricing, `area-${minimum}`)!;
  const mode = bookingMode(config.durationPer100SquareMetersMinutes * minimum / 100 / pricing.estimatedWorkers, { areaPricing }) === "multi" ? "Wielosesyjne" : "Jednosesyjne";
  const frequencies = [{ id: "once", label: "Jednorazowo", discount: "0%", description: "Jedna wizyta." },
    ...(config.recurringEnabled ? [{ id: "weekly", label: "Co tydzień", discount: `-${config.recurringDiscountPercent}%`, description: "Preferencja częstotliwości i rabat na tę wizytę. Kolejne wizyty rezerwujesz osobno." }] : [])];
  const profile = manager.create(ProviderProfileEntity, { ...(old ?? {}), id, accountId: account.id, published: true, areaPricing,
    provider: account.name, verified: old?.verified ?? false, service: offer.title, location: account.location.city,
    rating: old?.rating ?? 0, reviewsCount: old?.reviewsCount ?? 0, experience: old?.experience ?? "Nie podano", completedOrders: old?.completedOrders ?? 0,
    priceFrom: `${money(config.ratePerSquareMeterMinor / 100)} / m²`, tags: [mode], description: offer.description,
    metrics: [{ id: "location", label: "Obsługiwany obszar", value: account.location.city }],
    gallery: old?.gallery ?? [], photos: config.presentation ? [
      ...(config.presentation.banner ? [{ id: "banner", label: "Baner ogłoszenia", image: config.presentation.banner, gradient: "" }] : []),
      ...config.presentation.gallery.map((image, index) => ({ id: `gallery-${index}`, label: `Realizacja ${index + 1}`, image, gradient: "" }))
    ] : old?.photos ?? [], reviews: old?.reviews ?? [], pricing: [pricing], frequencies,
    addOns: config.addOns.map(addOn => ({ id: addOn.id, label: addOn.title, description: addOn.billingUnit === "halfHour" ? "Cena za 30 minut" : "Cena za sztukę",
      priceValue: addOn.priceMinor / 100, price: money(addOn.priceMinor / 100), durationMinutes: addOn.billingUnit === "halfHour" ? 30 : 0 })),
    standards: ["Usługa zgodna z opisem i zaakceptowanym standardem.", config.vacuumIncluded ? "Wykonawca przywozi odkurzacz." : "Odkurzacz zapewnia klient.",
      ...(config.requiresClientPhotos ? ["Wykonawca prosi o zdjęcia przed wizytą; uzgodnij ich przekazanie po rezerwacji."] : [])],
    bookingSettings: { ...defaultWorkingHours, bufferMinutes: config.bufferEnabled ? config.bufferMinutes : 0, leadHours: config.leadTimeEnabled ? config.leadHours : 0 },
    summary: { duration: pricing.duration, total: pricing.price, lines: [{ id: pricing.id, label: pricing.label, value: pricing.price }] }
  });
  await manager.save(ProviderProfileEntity, profile);
  await manager.save(BoardListingEntity, manager.create(BoardListingEntity, { id, provider: account.name, rating: profile.rating, reviews: profile.reviewsCount,
    experience: profile.experience, price: profile.priceFrom, completedOrders: profile.completedOrders, mode, modeTone: "blue",
    image: config.presentation?.banner ?? "/clingo-homepage/assets/images/logo-clingo-color-new.png", imageFit: config.presentation?.banner ? "cover" : "contain", imageScale: null, orderIndex: -1 }));
}
