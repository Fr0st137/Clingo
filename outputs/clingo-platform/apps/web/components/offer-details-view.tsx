"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ProviderProfileData } from "./provider-profile-view";

type AddOn = NonNullable<ProviderProfileData["addOns"]>[number];

const fallbackOverview = [
  { id: "rating", label: "Ocena", value: "5.0" },
  { id: "orders", label: "Wykonane usługi", value: "87" },
  { id: "experience", label: "Doświadczenie", value: "3 lata" },
  { id: "location", label: "Obszar", value: "Warszawa" }
];

const fallbackPricing = [
  {
    id: "single",
    label: "Jednorazowe sprzątanie",
    description: "Mieszkanie 62m², zakres podstawowy z dojazdem.",
    price: "165 zł",
    priceValue: 165,
    duration: "3 godziny 15 minut"
  }
];

const fallbackFrequencies = [
  { id: "once", label: "Jednorazowo", description: "Pojedyncza realizacja bez stałego harmonogramu.", discount: "0%" },
  { id: "weekly", label: "Co tydzień", description: "Stały termin i powtarzalny zakres sprzątania.", discount: "-8%" }
];

function priceFromText(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  return Number(normalized || 0);
}

function formatPrice(value: number) {
  return `${value.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;
}

function SectionCard({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section className="rounded-[30px] border border-[#e5e7eb] bg-white p-[30px] shadow-[0px_4px_18px_0px_rgba(15,23,42,0.08)]">
      {title ? <h2 className="m-0 text-[22px] font-bold leading-5 text-[#2e3b4c]">{title}</h2> : null}
      {children}
    </section>
  );
}

function photoBackground(gradient: string) {
  if (gradient.startsWith("linear-gradient")) {
    return gradient;
  }

  const knownGradients: Record<string, string> = {
    "from-[#c9b9a3] to-[#f3e3ce]": "linear-gradient(135deg, #c9b9a3 0%, #f3e3ce 100%)",
    "from-[#c7d0cf] to-[#8d9b93]": "linear-gradient(135deg, #c7d0cf 0%, #8d9b93 100%)",
    "from-[#dbe8f6] to-[#aabbd0]": "linear-gradient(135deg, #dbe8f6 0%, #aabbd0 100%)"
  };

  return knownGradients[gradient] ?? "linear-gradient(135deg, #dbe8f6 0%, #f7f9fc 100%)";
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-[2px]" aria-label={`Ocena ${rating} na 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <img
          alt=""
          className="h-[14px] w-[16px]"
          key={index}
          src="/figma-assets/board-rating-star.svg"
          style={{ opacity: index < Math.round(rating) ? 1 : 0.22 }}
        />
      ))}
    </span>
  );
}

function profileHeaderImage(id: string) {
  if (id === "stepapp") {
    return { fit: "object-contain", src: "/figma-assets/board-stepapp-logo.png" };
  }

  if (id === "mobimop") {
    return { fit: "object-contain", src: "/figma-assets/board-mobimop-logo.png" };
  }

  return { fit: "object-cover", src: "/figma-assets/board-avatar-paulina.png" };
}

function addOnIcon(addOn: AddOn) {
  const id = addOn.id.toLowerCase();
  const label = addOn.label.toLowerCase();

  if (id.includes("window") || label.includes("okien")) {
    return "/clingo-homepage/assets/icons/addon-mycie-okien.png";
  }

  if (id.includes("fridge") || label.includes("lodów")) {
    return "/clingo-homepage/assets/icons/addon-lodowka.png";
  }

  if (id.includes("dishes") || label.includes("naczy")) {
    return "/clingo-homepage/assets/icons/addon-naczynia.png";
  }

  if (id.includes("oven") || label.includes("piekarnik")) {
    return "/clingo-homepage/assets/icons/addon-piekarnik.png";
  }

  if (id.includes("microwave") || label.includes("mikrofal")) {
    return "/clingo-homepage/assets/icons/addon-mikrofalowka.png";
  }

  if (id.includes("hood") || id.includes("okap") || label.includes("okapu")) {
    return "/clingo-homepage/assets/icons/addon-okap.png";
  }

  if (id.includes("ironing") || id.includes("prasowanie") || label.includes("prasowanie")) {
    return "/clingo-homepage/assets/icons/addon-prasowanie.png";
  }

  if (id.includes("litter") || id.includes("kuweta") || label.includes("kuwety")) {
    return "/clingo-homepage/assets/icons/addon-kuweta.png";
  }

  if (id.includes("wardrobe") || label.includes("szafy")) {
    return "/clingo-homepage/assets/icons/addon-szafa.png";
  }

  if (id.includes("cabinet") || label.includes("szafek")) {
    return "/clingo-homepage/assets/icons/addon-szafki.png";
  }

  return "/clingo-homepage/assets/icons/services-extra.svg";
}

function AddOnTile({
  addOn,
  onChoose,
  onDecrement,
  onIncrement,
  quantity
}: {
  addOn: AddOn;
  onChoose: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
  quantity: number;
}) {
  const isActive = quantity > 0;

  return (
    <article
      className={[
        "relative flex min-h-[126px] w-[150px] cursor-pointer flex-col items-center gap-[5px] overflow-hidden rounded-[30px] border px-[13px] py-[15px]",
        isActive ? "border-[#c2c9d5] bg-[#dee4ea]" : "border-[#e5e7eb] bg-white"
      ].join(" ")}
      onClick={isActive ? undefined : onChoose}
    >
      <span className={["absolute right-[21px] top-[19px] flex h-[14px] w-[14px] items-center justify-center", isActive ? "opacity-100" : "opacity-0"].join(" ")}>
        <img alt="" className="h-[14px] w-[14px] object-contain" src="/clingo-homepage/assets/icons/addon-check.svg" />
      </span>

      <span className="flex items-center justify-center rounded-[30px] p-[5px]">
        <img alt="" className="h-[40px] w-[40px] object-contain" src={addOnIcon(addOn)} />
      </span>

      <span className="flex h-[36px] w-[124px] items-center justify-center px-0 py-[2px] text-center text-[13px] font-normal leading-[17px] text-[#2e3b4c]">
        {addOn.label}
      </span>

      {isActive ? (
        <div className="inline-flex h-[30px] w-[124px] items-center justify-center rounded-[30px] bg-[#0079de] px-[2px] py-[6px] text-[14px] font-normal leading-none text-white">
          <button
            aria-label={`Zmniejsz ilość: ${addOn.label}`}
            className="relative h-[17px] flex-1 before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-[9px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-[5px] before:bg-white"
            onClick={(event) => {
              event.stopPropagation();
              onDecrement();
            }}
            type="button"
          />
          <span className="w-[22px] text-center">{quantity}</span>
          <span>szt.</span>
          <button
            aria-label={`Zwiększ ilość: ${addOn.label}`}
            className="relative h-[17px] flex-1 before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-[9px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-[5px] before:bg-white after:absolute after:left-1/2 after:top-1/2 after:h-px after:w-[9px] after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-90 after:rounded-[5px] after:bg-white"
            onClick={(event) => {
              event.stopPropagation();
              onIncrement();
            }}
            type="button"
          />
        </div>
      ) : (
        <button
          className="inline-flex h-[30px] w-[124px] items-center justify-center rounded-[30px] bg-[#0079de] px-0 py-[6px] text-[14px] font-normal leading-none text-white"
          onClick={(event) => {
            event.stopPropagation();
            onChoose();
          }}
          type="button"
        >
          Wybierz
        </button>
      )}
    </article>
  );
}

function initialQuantities(addOns: AddOn[]) {
  return addOns.reduce<Record<string, number>>((accumulator, addOn) => {
    if (addOn.selected) {
      accumulator[addOn.id] = 1;
    }

    return accumulator;
  }, {});
}

function selectedQuantityEntries(addOns: AddOn[], quantities: Record<string, number>) {
  return addOns
    .map((addOn) => ({ addOn, quantity: quantities[addOn.id] ?? 0 }))
    .filter((entry) => entry.quantity > 0);
}

export function OfferDetailsView({ profile }: { profile: ProviderProfileData }) {
  const headerImage = profileHeaderImage(profile.id);
  const photos: Array<{ id: string; label: string; gradient: string; image?: string }> = profile.photos?.length
    ? profile.photos
    : profile.gallery;
  const overview = profile.overview?.length ? profile.overview : fallbackOverview;
  const pricing = profile.pricing?.length ? profile.pricing : fallbackPricing;
  const frequencies = profile.frequencies?.length ? profile.frequencies : fallbackFrequencies;
  const addOns = profile.addOns ?? [];
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>(() => initialQuantities(addOns));

  const selectedAddOnItems = useMemo(
    () => selectedQuantityEntries(addOns, addOnQuantities),
    [addOns, addOnQuantities]
  );

  const baseTotal = priceFromText(profile.summary.total);
  const liveTotal = baseTotal + selectedAddOnItems.reduce((sum, { addOn, quantity }) => sum + addOn.priceValue * quantity, 0);
  const addOnDuration = selectedAddOnItems.reduce((sum, { addOn, quantity }) => sum + addOn.durationMinutes * quantity, 0);

  const setAddOnQuantity = (id: string, updater: (current: number) => number) => {
    setAddOnQuantities((current) => {
      const nextQuantity = Math.max(0, updater(current[id] ?? 0));
      const next = { ...current };

      if (nextQuantity === 0) {
        delete next[id];
      } else {
        next[id] = nextQuantity;
      }

      return next;
    });
  };

  return (
    <section className="mx-auto grid w-full max-w-[1200px] gap-[20px] pb-[60px] xl:grid-cols-[800px_380px]" data-node-id="812:1568">
      <main className="grid w-full gap-[20px] xl:w-[800px]">
        <SectionCard>
          <div className="flex items-start gap-[20px]">
            <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[20px] bg-[#ffd6e6] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.15)]">
              <img alt="" className={`absolute inset-0 h-full w-full ${headerImage.fit}`} src={headerImage.src} />
            </div>
            <div className="min-w-0 flex-1 pt-[4px]">
              <div className="flex flex-wrap items-center gap-[10px]">
                <h1 className="m-0 text-[28px] font-bold leading-[34px] text-[#2e3b4c]">{profile.provider}</h1>
                {profile.verified ? (
                  <span className="inline-flex h-[25px] items-center gap-[8px] rounded-[30px] bg-[#e9f5ff] px-[10px] text-[12px] font-normal leading-[15px] text-[#0079de]">
                    <img alt="" className="h-[12px] w-[12px]" src="/figma-assets/board-check.svg" />
                    Zweryfikowana
                  </span>
                ) : null}
              </div>
              <p className="m-0 mt-[8px] text-[15px] font-normal leading-5 text-[#2e3b4c]">{profile.service}</p>
              <p className="m-0 mt-[8px] flex items-center gap-[8px] text-[13px] font-normal leading-[17px] text-[#7c8691]">
                <img alt="" className="h-[12px] w-[12px]" src="/figma-assets/order-map.svg" />
                {profile.location}
              </p>
              <div className="mt-[12px] flex items-center gap-[8px] text-[14px] font-normal leading-5 text-[#2e3b4c]">
                <RatingStars rating={profile.rating} />
                <span className="font-semibold">{profile.rating.toFixed(1)}</span>
                <span className="text-[#0079de]">({profile.reviewsCount} ocen)</span>
              </div>
            </div>
          </div>

          <div className="mt-[20px] grid grid-cols-2 gap-[15px] md:grid-cols-4">
            {overview.map((item) => (
              <article className="h-[82px] rounded-[15px] bg-[#f7f9fc] px-[15px] py-[14px]" key={item.id}>
                <p className="m-0 text-[12px] font-normal leading-[16px] text-[#7c8691]">{item.label}</p>
                <p className="m-0 mt-[8px] text-[18px] font-bold leading-6 text-[#2e3b4c]">{item.value}</p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Zdjęcia">
          <div className="mt-[20px] grid h-auto grid-cols-2 gap-[15px] md:h-[355px] md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
            {photos.slice(0, 5).map((photo, index) => (
              <figure
                className={[
                  "m-0 h-[164px] overflow-hidden rounded-[20px] md:h-auto",
                  index === 0 ? "col-span-2 md:col-span-1 md:row-span-2" : ""
                ].join(" ")}
                key={photo.id}
                style={{ background: photoBackground(photo.gradient) }}
              >
                {photo.image ? <img alt={photo.label} className="h-full w-full object-cover" src={photo.image} /> : null}
                <figcaption className="sr-only">{photo.label}</figcaption>
              </figure>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Opis">
          <p className="m-0 mt-[20px] text-[14px] font-normal leading-[24px] text-[#2e3b4c]">{profile.description}</p>
          <div className="mt-[20px] flex flex-wrap gap-[10px]">
            {profile.tags.map((tag) => (
              <span className="rounded-[30px] bg-[#e9f5ff] px-[12px] py-[5px] text-[13px] font-normal leading-[17px] text-[#0079de]" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Opinie">
          <div className="mt-[20px] flex items-center justify-between rounded-[15px] bg-[#f7f9fc] px-[20px] py-[18px]">
            <div>
              <p className="m-0 text-[28px] font-bold leading-8 text-[#2e3b4c]">{profile.rating.toFixed(1)}</p>
              <p className="m-0 mt-[4px] text-[13px] font-normal leading-[18px] text-[#7c8691]">{profile.reviewsCount} opinii</p>
            </div>
            <RatingStars rating={profile.rating} />
          </div>
          <div className="mt-[15px] grid gap-[15px]">
            {profile.reviews.slice(0, 2).map((review) => (
              <article className="rounded-[15px] border border-[#e6edf3] bg-white p-[15px]" key={review.id}>
                <div className="flex items-start justify-between gap-[15px]">
                  <div>
                    <h3 className="m-0 text-[15px] font-bold leading-5 text-[#2e3b4c]">{review.author}</h3>
                    <p className="m-0 mt-[4px] text-[12px] font-normal leading-4 text-[#7c8691]">{review.date}</p>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                <p className="m-0 mt-[12px] text-[13px] font-normal leading-[21px] text-[#2e3b4c]">{review.content}</p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Cennik i częstotliwość sprzątania">
          <div className="mt-[20px] grid gap-[15px]">
            {pricing.map((item) => (
              <article className="flex min-h-[82px] items-center justify-between gap-[20px] rounded-[15px] border border-[#e6edf3] bg-[#f9fafb] px-[15px] py-[14px]" key={item.id}>
                <div>
                  <h3 className="m-0 text-[15px] font-semibold leading-5 text-[#2e3b4c]">{item.label}</h3>
                  <p className="m-0 mt-[4px] text-[13px] font-normal leading-[18px] text-[#7c8691]">{item.description}</p>
                  <p className="m-0 mt-[6px] text-[12px] font-normal leading-4 text-[#9ca3af]">{item.duration}</p>
                </div>
                <p className="m-0 shrink-0 text-[18px] font-bold leading-6 text-[#2e3b4c]">{item.price}</p>
              </article>
            ))}
          </div>
          <div className="mt-[15px] grid grid-cols-1 gap-[15px] md:grid-cols-3">
            {frequencies.map((frequency) => (
              <article className="min-h-[92px] rounded-[15px] border border-[#e6edf3] bg-white p-[15px]" key={frequency.id}>
                <div className="flex items-start justify-between gap-[10px]">
                  <h3 className="m-0 text-[14px] font-semibold leading-5 text-[#2e3b4c]">{frequency.label}</h3>
                  <span className="rounded-[30px] bg-[#e9f5ff] px-[10px] py-[4px] text-[12px] font-normal leading-[15px] text-[#0079de]">
                    {frequency.discount}
                  </span>
                </div>
                <p className="m-0 mt-[8px] text-[12px] font-normal leading-[18px] text-[#7c8691]">{frequency.description}</p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Usługi dodatkowe">
          <div className="mt-[20px] grid gap-x-[17px] gap-y-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, 150px)" }}>
            {addOns.map((addOn) => (
              <AddOnTile
                addOn={addOn}
                key={addOn.id}
                onChoose={() => setAddOnQuantity(addOn.id, () => 1)}
                onDecrement={() => setAddOnQuantity(addOn.id, (quantity) => quantity - 1)}
                onIncrement={() => setAddOnQuantity(addOn.id, (quantity) => quantity + 1)}
                quantity={addOnQuantities[addOn.id] ?? 0}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Opinie">
          <div className="mt-[20px] grid gap-[15px]">
            {profile.reviews.map((review) => (
              <article className="rounded-[15px] bg-[#f7f9fc] p-[15px]" key={review.id}>
                <div className="flex items-start justify-between gap-[15px]">
                  <div>
                    <h3 className="m-0 text-[15px] font-bold leading-5 text-[#2e3b4c]">{review.author}</h3>
                    <p className="m-0 mt-[4px] text-[12px] font-normal leading-4 text-[#7c8691]">{review.date}</p>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                <p className="m-0 mt-[12px] text-[13px] font-normal leading-[21px] text-[#2e3b4c]">{review.content}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </main>

      <aside className="self-start xl:sticky xl:top-[96px]">
        <section className="w-full max-w-[380px] rounded-[32px] border border-[#e5e7eb] bg-white px-[30px] py-[30px] shadow-[0px_4px_18px_0px_rgba(15,23,42,0.08)] xl:w-[380px]">
          <h2 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Podsumowanie</h2>
          <div className="mt-[20px] rounded-[15px] bg-[#f7f9fc] px-[15px] py-[15px]">
            <p className="m-0 text-[14px] font-normal leading-5 text-[#2e3b4c]">Szacowany czas realizacji</p>
            <p className="m-0 mt-[5px] inline-flex min-h-[32px] items-center rounded-[10px] border border-[#e5e7eb] bg-white px-[20px] text-[14px] font-normal leading-5 text-[#2e3b4c]">
              {profile.summary.duration}
              {addOnDuration ? ` + ${addOnDuration} min` : ""}
            </p>
          </div>

          <dl className="mt-[20px] grid gap-[8px] rounded-[15px] bg-[#f7f9fc] px-[15px] py-[15px] text-[14px] font-normal leading-5 text-[#2e3b4c]">
            {profile.summary.lines.map((line) => (
              <div className="flex min-h-[20px] justify-between gap-[14px]" key={line.id}>
                <dt>{line.label}</dt>
                <dd className="m-0 shrink-0">{line.value}</dd>
              </div>
            ))}
            {selectedAddOnItems.map(({ addOn, quantity }) => (
              <div className="flex min-h-[20px] justify-between gap-[14px]" key={addOn.id}>
                <dt>
                  {addOn.label}
                  {quantity > 1 ? ` (${quantity} szt.)` : ""}
                </dt>
                <dd className="m-0 shrink-0">{formatPrice(addOn.priceValue * quantity)}</dd>
              </div>
            ))}
            <div className="mt-[2px] flex h-[30px] justify-between border-t border-[#e5e7eb] pt-[10px] font-bold">
              <dt>Suma</dt>
              <dd className="m-0">{formatPrice(liveTotal)}</dd>
            </div>
          </dl>

          <a
            className="mt-[20px] flex h-[46px] w-full items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white"
            href="/zamowienie"
          >
            Przejdź do zamówienia
          </a>

          <p className="m-0 mt-[18px] text-[12px] font-normal leading-[18px] text-[#7c8691]">
            Rozliczenie odbywa się bezpośrednio z Wykonawcą poza platformą.
          </p>
        </section>
      </aside>
    </section>
  );
}
