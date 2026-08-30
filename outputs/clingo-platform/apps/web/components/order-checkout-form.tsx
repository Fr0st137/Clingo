"use client";

import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AccountProfile } from "../lib/account";
import { updateAccountProfile } from "../lib/account";
import { createOrder } from "../lib/order-client";
import { OrderProcessShell } from "./order-process-shell";
import type { ProviderProfileData } from "./provider-profile-view";
import { OrderSummaryCard } from "./order-summary-card";

type OrderCheckoutFormProps = {
  addOns: Array<{ id: string; quantity: number }>;
  defaultDate: string;
  email: string;
  frequencyId: string;
  pricingId: string;
  profile: ProviderProfileData;
  user: AccountProfile;
};

function discountPercent(value: string) {
  return Math.abs(Number(value.replace(/[^\d]/g, "")) || 0);
}

function parseDurationMinutes(value: string) {
  const hours = Number(value.match(/(\d+)\s*godz/)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)\s*min/)?.[1] ?? 0);
  return Math.max(30, hours * 60 + minutes);
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours} godz.` : "", rest ? `${rest} min` : ""].filter(Boolean).join(" ") || "30 min";
}

function Field({
  icon: Icon,
  label,
  name,
  onChange,
  required = true,
  type = "text",
  value
}: {
  icon?: typeof CalendarDays;
  label: string;
  name: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="relative flex h-[68px] w-full flex-col justify-center rounded-[15px] border border-[#dce6f2] bg-white px-[20px] pt-[10px] text-[12px] leading-4 text-[#7c8691] focus-within:border-[#0079de]">
      {label}
      <span className="mt-[4px] flex items-center gap-[10px]">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-[#0079de]" strokeWidth={1.8} /> : null}
        <input
          className="h-6 min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] leading-5 text-[#2e3b4c] outline-none"
          name={name}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}

export function OrderCheckoutForm({
  addOns,
  defaultDate,
  email,
  frequencyId,
  pricingId,
  profile,
  user
}: OrderCheckoutFormProps) {
  const router = useRouter();
  const pricing = profile.pricing?.find((item) => item.id === pricingId) ?? profile.pricing?.[0];
  const frequency = profile.frequencies?.find((item) => item.id === frequencyId) ?? profile.frequencies?.[0];
  const selectedAddOns = addOns.flatMap((selection) => {
    const addOn = profile.addOns?.find((item) => item.id === selection.id);
    return addOn && selection.quantity > 0 ? [{ addOn, quantity: selection.quantity }] : [];
  });
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [street, setStreet] = useState(user.street ?? "");
  const [apartment, setApartment] = useState(user.apartment ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [postalCode, setPostalCode] = useState(user.postalCode ?? "");
  const [saveAddress, setSaveAddress] = useState(!user.street || !user.city);
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const summary = useMemo(() => {
    const discount = discountPercent(frequency?.discount ?? "0%");
    const base = Math.round((pricing?.priceValue ?? 0) * (1 - discount / 100));
    const addOnsTotal = selectedAddOns.reduce((sum, { addOn, quantity }) => sum + addOn.priceValue * quantity, 0);
    const duration =
      parseDurationMinutes(pricing?.duration ?? profile.summary.duration) +
      selectedAddOns.reduce((sum, { addOn, quantity }) => sum + addOn.durationMinutes * quantity, 0);

    return {
      duration: formatDuration(duration),
      lines: [
        ...(pricing ? [{ id: pricing.id, label: pricing.label, value: `${base} zł` }] : []),
        ...selectedAddOns.map(({ addOn, quantity }) => ({
          id: addOn.id,
          label: `${addOn.label}${quantity > 1 ? ` (${quantity} szt.)` : ""}`,
          value: `${addOn.priceValue * quantity} zł`
        }))
      ],
      total: `${base + addOnsTotal} zł`
    };
  }, [frequency?.discount, pricing, profile.summary.duration, selectedAddOns]);

  const address = [postalCode, city].filter(Boolean).join(" ") + `, ${street}${apartment ? `/${apartment}` : ""}`;

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!pricing || !frequency) {
      setStatusMessage("Nie udało się odczytać konfiguracji usługi.");
      return;
    }

    if (step === 1) {
      setStatusMessage("");
      setStep(2);
      window.scrollTo({ behavior: "smooth", top: 0 });
      return;
    }

    if (!accepted) {
      setStatusMessage("Potwierdź dane i warunki zamówienia.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      if (saveAddress) {
        await updateAccountProfile(email, { apartment, city, postalCode, street });
      }

      const order = await createOrder({
        addOns: selectedAddOns.map(({ addOn, quantity }) => ({ id: addOn.id, quantity })),
        address,
        email,
        frequencyId: frequency.id,
        pricingId: pricing.id,
        providerId: profile.id,
        startsAt: new Date(`${date}T${time}:00`).toISOString()
      });

      router.push(`/zamowienie/potwierdzenie?id=${encodeURIComponent(order.id ?? "")}`);
      router.refresh();
    } catch {
      setStatusMessage("Nie udało się zapisać zamówienia. Sprawdź dane i spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OrderProcessShell activeStep={step}>
      <form className="mx-auto grid w-full max-w-[1200px] gap-[20px] pb-[60px] xl:grid-cols-[800px_380px]" onSubmit={submitOrder}>
        <main className="grid gap-[20px]">
          <section className="w-full rounded-[30px] border border-[#dce6f2] bg-white p-[24px] shadow-figma md:p-[30px]">
            <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Zamówienie</h1>
            <p className="m-0 mt-[10px] text-[14px] leading-5 text-[#7c8691]">
              {step === 1 ? "Sprawdź usługę i wybierz dogodny termin." : "Sprawdź dane przed złożeniem zamówienia."}
            </p>

            <div className="mt-[20px] grid gap-[15px] md:grid-cols-2">
              <section className="h-[68px] rounded-[15px] bg-[#f7f9fc] px-[20px] py-[14px]">
                <p className="m-0 text-[12px] leading-4 text-[#7c8691]">Wykonawca</p>
                <p className="m-0 mt-1 text-[14px] font-semibold leading-5 text-[#2e3b4c]">{profile.provider}</p>
              </section>
              <section className="h-[68px] rounded-[15px] bg-[#f7f9fc] px-[20px] py-[14px]">
                <p className="m-0 text-[12px] leading-4 text-[#7c8691]">Częstotliwość</p>
                <p className="m-0 mt-1 text-[14px] font-semibold leading-5 text-[#2e3b4c]">{frequency?.label}</p>
              </section>
              <Field icon={CalendarDays} label="Data" name="date" onChange={setDate} type="date" value={date} />
              <Field icon={Clock3} label="Godzina rozpoczęcia" name="time" onChange={setTime} type="time" value={time} />
            </div>
          </section>

          <section className="w-full rounded-[30px] border border-[#dce6f2] bg-white p-[24px] shadow-figma md:p-[30px]">
            <div className="flex items-center gap-[10px]">
              <MapPin className="h-5 w-5 text-[#0079de]" strokeWidth={1.8} />
              <h2 className="m-0 text-[20px] font-bold leading-6 text-[#2e3b4c]">Adres realizacji</h2>
            </div>
            <div className="mt-[20px] grid gap-[15px] md:grid-cols-2">
              <Field label="Ulica i numer" name="street" onChange={setStreet} value={street} />
              <Field label="Numer mieszkania" name="apartment" onChange={setApartment} required={false} value={apartment} />
              <Field label="Kod pocztowy" name="postal-code" onChange={setPostalCode} value={postalCode} />
              <Field label="Miasto" name="city" onChange={setCity} value={city} />
            </div>
            <label className="mt-[18px] flex cursor-pointer items-center gap-[10px] text-[13px] leading-5 text-[#2e3b4c]">
              <input checked={saveAddress} className="h-4 w-4 accent-[#0079de]" onChange={(event) => setSaveAddress(event.target.checked)} type="checkbox" />
              Zapisz ten adres na moim koncie
            </label>
          </section>

          {step === 2 ? (
            <section className="w-full rounded-[30px] border border-[#dce6f2] bg-white p-[24px] shadow-figma md:p-[30px]">
              <label className="flex cursor-pointer items-start gap-[10px] text-[13px] leading-5 text-[#2e3b4c]">
                <input checked={accepted} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0079de]" onChange={(event) => setAccepted(event.target.checked)} required type="checkbox" />
                Potwierdzam poprawność danych oraz akceptuję warunki realizacji usługi.
              </label>
              <button
                className="mt-[15px] border-0 bg-transparent p-0 text-[13px] font-semibold text-[#0079de]"
                onClick={() => {
                  setAccepted(false);
                  setStatusMessage("");
                  setStep(1);
                  window.scrollTo({ behavior: "smooth", top: 0 });
                }}
                type="button"
              >
                Wróć i edytuj dane
              </button>
              {statusMessage ? <p className="m-0 mt-[15px] text-[13px] leading-5 text-[#d63b3b]">{statusMessage}</p> : null}
            </section>
          ) : null}
        </main>

        <OrderSummaryCard
          actionLabel={step === 1 ? "Przejdź do podsumowania" : isSubmitting ? "Zapisywanie..." : "Złóż zamówienie"}
          disabled={isSubmitting || (step === 2 && !accepted)}
          submit
          summary={summary}
        />
      </form>
    </OrderProcessShell>
  );
}
