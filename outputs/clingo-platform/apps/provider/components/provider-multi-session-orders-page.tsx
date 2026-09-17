import { multiSessionOrders as orders } from "./provider-orders-data";
import Link from "next/link";
import { ProviderBackLink } from "./provider-list-controls";
import { ProviderMultiSessionOrderCard } from "./provider-order-card";
import { ProviderShell } from "./provider-shell";

export function ProviderMultiSessionOrdersPage() {
  return (
    <ProviderShell active="Zlecenia" figmaNode="3931:4993">
      <section className="multi-session-orders-content" aria-labelledby="multi-session-orders-title">
        <ProviderBackLink href="/orders" />
        <div className="multi-session-orders-list">
          <div className="multi-session-orders-heading"><div><h1 id="multi-session-orders-title">Zlecenia wielosesyjne</h1><p>Zlecenia wielosesyjne widnieje także na liście zamówień jako poszczególne sesje.</p></div><button type="button" disabled className="multi-session-orders-sort"><span><strong>Sortuj:</strong> Data początkowa, rosnąco</span><img src="/figma-assets/orders/multi-session/dropdown.svg" alt="" /></button></div>
          {orders.map(order => <div className="multi-session-edit-row" key={order.id}><ProviderMultiSessionOrderCard order={order} href="/orders/multi-session/details" /><Link href={`/orders/${order.id}/edit`} className="multi-session-edit-button" aria-label={`Edytuj zamówienie: ${order.client}`}><img src="/figma-assets/shared/pencil.svg" alt="" /></Link></div>)}
        </div>
        <div className="multi-session-orders-spacer" aria-hidden="true" />
      </section>
    </ProviderShell>
  );
}
