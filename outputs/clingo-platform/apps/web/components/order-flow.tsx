import Link from "next/link";
import { Check } from "lucide-react";
import { OrderCardData } from "./order-card";

import { OrderProcessShell } from "./order-process-shell";
import { PublicShell } from "./public-shell";
import { CustomerOrderDetails } from "./customer-order-details";
import { DashboardShell } from "./dashboard-shell";
import { OrderRescheduleForm } from "./order-reschedule-form";
import type { RescheduleActions } from "../lib/order-reschedule";

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
  return (
    <DashboardShell active="Rezerwacje">
      <section className={`w-full pb-[60px] ${order?.mode === "Wielosesyjne" || (order?.bookingDetails?.sessions?.length ?? 0) > 1 ? "max-w-[703px]" : "max-w-[640px]"}`}>
        <Link href="/zamowienia" className="mb-[25px] inline-flex py-[15px] text-[14px] text-[#0079de] hover:underline">← Wróć do rezerwacji</Link>
        {order ? <CustomerOrderDetails order={order} /> : <p className="rounded-[20px] border border-[#e5e7eb] bg-white p-[25px] text-[14px] text-[#7c8691]">Nie udało się pobrać szczegółów zlecenia.</p>}
      </section>
    </DashboardShell>
  );
}
export function OrderReschedulePage({ order, initialSessionIndex, ...actions }: RescheduleActions & { order: OrderCardData | null; initialSessionIndex?: number }) {
  return <DashboardShell active="Rezerwacje">
    <section className="w-full max-w-[1170px] pb-[60px]">
      <h1 className="mb-[25px] mt-[20px] text-[22px] font-semibold text-[#2e3b4c]">Przełóż zlecenie</h1>
      {order ? <OrderRescheduleForm key={`${order.id}-${initialSessionIndex ?? "default"}`} order={order} initialSessionIndex={initialSessionIndex} {...actions} /> : <p className="rounded-[20px] bg-white p-[25px] text-[#7c8691]">Nie udało się pobrać zlecenia. <Link href="/zamowienia" className="text-[#0079de]">Wróć do rezerwacji</Link></p>}
    </section>
  </DashboardShell>;
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
