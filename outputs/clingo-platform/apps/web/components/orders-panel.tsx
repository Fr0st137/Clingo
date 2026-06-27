"use client";

import { useMemo, useState } from "react";
import { CompletedOrderCard, OrderCard, OrderCardData } from "./order-card";
import { OrderDetailsModal } from "./order-details-modal";

type OrdersPanelProps = {
  orders: OrderCardData[];
  completedOrder: OrderCardData;
};

const tabs = ["Wszystkie", "Nadchodzące", "Zakończone"];

export function OrdersPanel({ orders, completedOrder }: OrdersPanelProps) {
  const [activeTab, setActiveTab] = useState("Wszystkie");
  const [selectedOrder, setSelectedOrder] = useState<OrderCardData | null>(null);

  const visibleUpcomingOrders = useMemo(() => {
    if (activeTab === "Zakończone") {
      return [];
    }
    return orders;
  }, [activeTab, orders]);

  const showCompleted = activeTab !== "Nadchodzące";

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2 md:hidden">
        {tabs.map((tab) => (
          <button
            className={[
              "h-9 rounded-full px-4 text-[13px] font-semibold transition-all",
              activeTab === tab ? "bg-clingo-blue text-white" : "border border-[#dfe8f2] bg-white text-[#65768c]"
            ].join(" ")}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-[30px] md:max-w-[745px]">
        {visibleUpcomingOrders.map((order) => (
          <OrderCard key={order.id ?? order.provider} onPrimaryAction={setSelectedOrder} order={order} />
        ))}

        {showCompleted ? (
          <>
            <h2 className="text-[22px] font-bold leading-5 text-clingo-ink">Zakończone zlecenia</h2>
            <CompletedOrderCard onPrimaryAction={setSelectedOrder} order={completedOrder} />
          </>
        ) : null}
      </section>

      <OrderDetailsModal onClose={() => setSelectedOrder(null)} order={selectedOrder} />
    </>
  );
}
