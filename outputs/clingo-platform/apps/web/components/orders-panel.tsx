import { CompletedOrderCard, OrderCard, OrderCardData } from "./order-card";

type OrdersPanelProps = {
  completedOrder: OrderCardData | null;
  orders: OrderCardData[];
};

function EmptyOrderCard({ children, height }: { children: string; height: number }) {
  return (
    <div
      className="flex w-[745px] items-center justify-center rounded-[18px] border border-[#e6edf3] bg-white text-[14px] text-[#7c8691] shadow-[0px_8px_24px_0px_rgba(15,23,42,0.08)]"
      style={{ height }}
    >
      {children}
    </div>
  );
}

export function OrdersPanel({ orders, completedOrder }: OrdersPanelProps) {
  return (
    <section className="relative min-h-[821px] w-full overflow-x-auto pb-[40px] md:w-[1090px]" data-node-id="4943:7839">
      <div className="flex min-h-[474px] w-[745px] flex-col gap-[30px]">
        {orders.length > 0 ? (
          orders.map((order) => <OrderCard key={order.id ?? order.provider} order={order} />)
        ) : (
          <EmptyOrderCard height={222}>Brak nadchodzących zleceń.</EmptyOrderCard>
        )}
      </div>

      <h2 className="mb-0 mt-[30px] text-[22px] font-bold leading-5 text-[#2e3b4c]">
        Zakończone zlecenia
      </h2>

      <div className="mt-[30px]">
        {completedOrder ? (
          <CompletedOrderCard order={completedOrder} />
        ) : (
          <EmptyOrderCard height={159}>Brak zakończonych zleceń.</EmptyOrderCard>
        )}
      </div>
    </section>
  );
}
