import { CompletedOrderCard, OrderCard, OrderCardData } from "./order-card";

type OrdersPanelProps = {
  completedOrder: OrderCardData;
  orders: OrderCardData[];
};

export function OrdersPanel({ orders, completedOrder }: OrdersPanelProps) {
  return (
    <section className="relative h-[821px] w-[1090px]" data-node-id="4943:7839">
      <div className="absolute left-0 top-0 flex w-[745px] flex-col gap-[30px]">
        {orders.map((order) => (
          <OrderCard key={order.id ?? order.provider} order={order} />
        ))}
      </div>

      <h2 className="absolute left-0 top-[504px] m-0 text-[22px] font-bold leading-5 text-[#2e3b4c]">
        Zakończone zlecenia
      </h2>

      <div className="absolute left-0 top-[554px]">
        <CompletedOrderCard order={completedOrder} />
      </div>
    </section>
  );
}
