import Link from "next/link";
import { CalendarDays, Check, Clock3, MapPin } from "lucide-react";
import { OrderCardData } from "./order-card";
import { OrderSummaryCard } from "./order-summary-card";
import { OrderProcessShell } from "./order-process-shell";
import { PublicShell } from "./public-shell";

function OrderField({ label, value, icon }: { label: string; value: string; icon?: "calendar" | "clock" | "map" }) {
  const Icon = icon === "calendar" ? CalendarDays : icon === "clock" ? Clock3 : icon === "map" ? MapPin : null;

  return (
    <section className="h-[68px] w-full rounded-[15px] border border-[#dce6f2] bg-white px-[20px] py-[14px]">
      <p className="m-0 text-[12px] leading-[16px] text-[#7c8691]">{label}</p>
      <div className="mt-[4px] flex items-center gap-[10px] text-[14px] leading-5 text-[#2e3b4c]">
        {Icon ? <Icon className="h-[16px] w-[16px] text-[#0079de]" strokeWidth={1.8} /> : null}
        <span>{value}</span>
      </div>
    </section>
  );
}

function MissingOrder({ message }: { message: string }) {
  return (
    <PublicShell>
      <section className="mx-auto grid w-[800px] gap-[20px] pb-[60px]">
        <section className="rounded-[32px] border border-[#dce6f2] bg-white p-[30px] text-[14px] leading-[22px] text-[#7c8691] shadow-figma">
          {message}
        </section>
      </section>
    </PublicShell>
  );
}

function orderTerm(order: OrderCardData) {
  if (order.dateLines.length >= 3) {
    return `${order.dateLines[0]}, ${order.dateLines[1]} → ${order.dateLines[2]}`;
  }

  if (order.dateLines.length === 2) {
    return `${order.dateLines[0]} → ${order.dateLines[1]}`;
  }

  return order.dateLines[0] ?? "Termin do ustalenia";
}

export function OrderConfirmationPage({ order }: { order: OrderCardData | null }) {
  if (!order) {
    return <MissingOrder message="Nie udało się pobrać złożonego zlecenia." />;
  }

  return (
    <OrderProcessShell activeStep={3}>
      <section className="mx-auto grid w-[800px] gap-[20px] pb-[60px]">
        <section className="grid h-[300px] place-items-center rounded-[32px] border border-[#dce6f2] bg-white px-[30px] shadow-figma">
          <div className="grid justify-items-center">
            <span className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#0079de] text-white">
              <Check className="h-[28px] w-[28px]" />
            </span>
            <h1 className="mt-[25px] text-[24px] font-bold leading-6 text-[#2e3b4c]">Zamówienie zostało złożone</h1>
            <p className="mt-[15px] w-[420px] text-center text-[14px] leading-[22px] text-[#2e3b4c]">
              {order.provider} · {orderTerm(order)}
            </p>
            <Link
              className="mt-[25px] flex h-[46px] w-[260px] items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white"
              href={`/zamowienia/szczegoly?id=${encodeURIComponent(order.id ?? "")}`}
            >
              Szczegóły zlecenia
            </Link>
          </div>
        </section>
      </section>
    </OrderProcessShell>
  );
}

export function OrderDetailsPage({ order }: { order: OrderCardData | null }) {
  if (!order) {
    return <MissingOrder message="Nie udało się pobrać szczegółów zlecenia." />;
  }

  return (
    <PublicShell>
      <section className="mx-auto grid w-[1200px] grid-cols-[800px_380px] gap-[20px] pb-[60px]">
        <main className="w-[800px] rounded-[30px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
          <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Szczegóły zlecenia</h1>
          <div className="mt-[20px] grid gap-[15px]">
            <OrderField label="Status" value={order.status} />
            <OrderField label="Wykonawca" value={order.provider} />
            <OrderField label="Usługa" value={order.details} />
            <OrderField label="Adres" value={order.address} icon="map" />
            <OrderField label="Termin" value={orderTerm(order)} icon="calendar" />
            {order.bookingDetails?.frequencyLabel ? <OrderField label="Częstotliwość" value={order.bookingDetails.frequencyLabel} /> : null}
            {order.bookingDetails?.contactName ? <OrderField label="Osoba kontaktowa" value={order.bookingDetails.contactName} /> : null}
            {order.bookingDetails?.contactPhone ? <OrderField label="Telefon kontaktowy" value={order.bookingDetails.contactPhone} /> : null}
            {order.bookingDetails?.notes ? <section className="rounded-[15px] border border-[#dce6f2] p-[20px] text-[14px]"><p className="mb-2 text-[#7c8691]">Uwagi do zamówienia</p><p className="whitespace-pre-wrap break-words">{order.bookingDetails.notes}</p></section> : null}
            {order.bookingDetails?.invoice ? <section className="rounded-[15px] border border-[#dce6f2] p-[20px] text-[14px]"><p className="mb-2 text-[#7c8691]">Dane do faktury</p><p>{order.bookingDetails.invoice.companyName}</p><p>NIP: {order.bookingDetails.invoice.taxId}</p><p>{order.bookingDetails.invoice.address}</p></section> : null}
          </div>
        </main>
        <OrderSummaryCard actionHref="/zamowienia" actionLabel="Wróć do rezerwacji" summary={order.summary ?? undefined} />
      </section>
    </PublicShell>
  );
}

export function OrderReschedulePage({
  action,
  order
}: {
  action?: (formData: FormData) => Promise<void>;
  order: OrderCardData | null;
}) {
  if (!order) {
    return <MissingOrder message="Nie udało się pobrać zlecenia do przełożenia." />;
  }

  return (
    <PublicShell>
      <section className="mx-auto grid w-[1200px] grid-cols-[800px_380px] gap-[20px] pb-[60px]">
        <main className="w-[800px] rounded-[30px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
          <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Przełóż zlecenie</h1>
          <div className="mt-[20px] grid gap-[15px]">
            <OrderField label="Aktualny termin" value={orderTerm(order)} icon="calendar" />
          </div>
          <form action={action} className="mt-[20px] grid gap-[20px]">
            <div className="grid grid-cols-2 gap-[15px]">
              <label className="grid h-[68px] rounded-[15px] border border-[#dce6f2] bg-white px-[20px] py-[12px] text-[12px] leading-[16px] text-[#7c8691]">
                Początek
                <input
                  className="mt-[4px] h-[24px] w-full border-0 bg-transparent p-0 text-[14px] leading-5 text-[#2e3b4c] outline-none"
                  name="startsAt"
                  required
                  type="datetime-local"
                />
              </label>
              <label className="grid h-[68px] rounded-[15px] border border-[#dce6f2] bg-white px-[20px] py-[12px] text-[12px] leading-[16px] text-[#7c8691]">
                Koniec
                <input
                  className="mt-[4px] h-[24px] w-full border-0 bg-transparent p-0 text-[14px] leading-5 text-[#2e3b4c] outline-none"
                  name="endsAt"
                  required
                  type="datetime-local"
                />
              </label>
            </div>
            <button className="flex h-[46px] w-[320px] items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white" type="submit">
              Przełóż zlecenie
            </button>
          </form>
        </main>
        <OrderSummaryCard
          actionHref={`/zamowienia/szczegoly?id=${encodeURIComponent(order.id ?? "")}`}
          actionLabel="Wróć do szczegółów"
          summary={order.summary ?? undefined}
        />
      </section>
    </PublicShell>
  );
}

export function OrderCancelPage({ action, order }: { action?: () => Promise<void>; order: OrderCardData | null }) {
  if (!order) {
    return <MissingOrder message="Nie udało się pobrać zlecenia do odwołania." />;
  }

  return (
    <PublicShell>
      <section className="mx-auto grid w-[800px] gap-[20px] pb-[60px]">
        <section className="rounded-[32px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
          <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Odwołaj zlecenie</h1>
          <p className="mt-[20px] w-[620px] text-[14px] leading-[22px] text-[#2e3b4c]">
            {order.status} · {order.provider} · {order.details}
          </p>
          <form action={action}>
            <button className="mt-[25px] flex h-[46px] w-[220px] items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white" type="submit">
              Odwołaj zlecenie
            </button>
          </form>
        </section>
      </section>
    </PublicShell>
  );
}

export function AddReviewPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid w-[800px] gap-[20px] pb-[60px]">
        <section className="rounded-[32px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
          <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Dodaj opinię</h1>
          <div className="mt-[20px] h-[120px] w-[740px] rounded-[15px] border border-[#dce6f2] bg-white p-[15px] text-[14px] leading-5 text-[#7c8691]">
            Treść opinii
          </div>
          <Link className="mt-[20px] flex h-[46px] w-[220px] items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white" href="/opinie">
            Dodaj opinię
          </Link>
        </section>
      </section>
    </PublicShell>
  );
}
