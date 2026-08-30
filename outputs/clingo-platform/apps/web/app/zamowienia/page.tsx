import { DashboardShell } from "../../components/dashboard-shell";
import { OrdersPanel } from "../../components/orders-panel";
import { getDashboard } from "../../lib/api";
import { cookies } from "next/headers";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const email = decodeURIComponent(cookieStore.get("clingo-user-email")?.value ?? "");
  const dashboard = await getDashboard(email);

  return (
    <DashboardShell active="Rezerwacje" user={dashboard.user}>
      <section className="w-full md:w-[1090px]">
        <header className="pb-5 md:h-[90px] md:pb-0 md:pt-[21px]">
          <h2 className="text-[22px] font-bold leading-5 text-clingo-ink">Rezerwacje</h2>
          <p className="mt-[13px] max-w-[560px] text-[14px] leading-5 text-clingo-muted">
            Zarządzaj terminami i sprawdzaj szczegóły swoich zleceń.
          </p>
        </header>

        <section className="relative md:mt-[10px] md:min-h-[821px] md:w-[1090px]">
          <OrdersPanel completedOrder={dashboard.completedOrder} orders={dashboard.orders} />
        </section>
      </section>
    </DashboardShell>
  );
}
