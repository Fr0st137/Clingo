import { serviceAreaStatus } from "./service-area";

type Category = "homes" | "offices" | "pressure" | "painting";
const types = [
  { id: "homes", category: "homes", labels: ["Mieszkań i domów", "Sprzątanie mieszkań i domów", "Sprzątanie obiektów · Mieszkań i domów"] },
  { id: "homes-after-renovation", category: "homes", labels: ["Po remoncie (Mieszkań i domów)", "Sprzątanie po remoncie", "Sprzątanie obiektów · Po remoncie (Mieszkań i domów)"] },
  { id: "offices", category: "offices", labels: ["Biur i lokali użytkowych", "Sprzątanie biur i lokali", "Sprzątanie biur i lokali użytkowych", "Sprzątanie obiektów · Biur i lokali użytkowych"] },
  { id: "pressure-paving", category: "pressure", labels: ["Mycie ciśnieniowe", "Kostki, chodników, tarasów", "Mycie kostki brukowej", "Mycie ciśnieniowe · Kostki, chodników, tarasów"] },
  { id: "pressure-facades", category: "pressure", labels: ["Mycie elewacji", "Mycie elewacji zewnętrznych", "Mycie ciśnieniowe · Elewacji zewnętrznych"] },
  { id: "pressure-roofs", category: "pressure", labels: ["Mycie dachów", "Mycie ciśnieniowe · Dachów skośnych i płaskich"] },
  { id: "pressure-solar", category: "pressure", labels: ["Mycie paneli fotowoltaicznych", "Mycie ciśnieniowe · Paneli fotowoltaicznych"] },
  { id: "painting-walls", category: "painting", labels: ["Malowanie powierzchni", "Malowanie ścian i sufitów", "Malowanie powierzchni · Ścian i sufitów"] },
  { id: "painting-facades", category: "painting", labels: ["Malowanie elewacji", "Malowanie elewacji zewnętrznych", "Malowanie powierzchni · Elewacji zewnętrznych"] },
  { id: "painting-metal-roofs", category: "painting", labels: ["Malowanie dachów blaszanych", "Malowanie powierzchni · Dachów blaszanych"] },
  { id: "painting-tiles", category: "painting", labels: ["Malowanie dachówek", "Malowanie powierzchni · Dachówek"] },
] as const;
const defaults: Record<Category, string> = { homes: "homes", offices: "offices", pressure: "pressure-paving", painting: "painting-walls" };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const identify = (value: string) => types.find(type => [type.id, ...type.labels].some(label => normalize(label) === normalize(value)));

export type CatalogueListing = {
  service?: string;
  serviceCategory?: string;
  serviceMetrics?: Array<{ id: string; label: string; value: string }>;
};
export function catalogueServiceType(listing: CatalogueListing): string | undefined {
  const labelled = identify(listing.service ?? "");
  const category = listing.serviceCategory;
  if (category && Object.prototype.hasOwnProperty.call(defaults, category)) {
    // A free-form offer title cannot move an offer into a different category.
    // The defaults are the concrete service descriptions used by the provider editor.
    return labelled?.category === category ? labelled.id : defaults[category as Category];
  }
  return labelled?.id;
}
export function matchesCatalogueRequest(listing: CatalogueListing, request: { service?: string; address?: string }): boolean {
  if (request.service?.trim()) {
    const requested = identify(request.service);
    if (!requested || catalogueServiceType(listing) !== requested.id) return false;
  }
  if (request.address?.trim() && serviceAreaStatus(listing.serviceMetrics ?? [], request.address) !== "supported") return false;
  return true;
}
