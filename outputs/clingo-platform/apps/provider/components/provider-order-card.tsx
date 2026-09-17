import Link from "next/link";

const asset = (name: string) => `/figma-assets/orders/${name}`;
const multiSessionAsset = (name: string) => `/figma-assets/orders/multi-session/${name}`;

export type ProviderOrder = {
  id?: string;
  start: string; end: string; client: string; service: string; detail: string;
  price: string; area: string; extras: number;
  employees: ReadonlyArray<"one" | "two">;
  cancelled?: boolean; external?: boolean;
};

export type ProviderMultiSessionOrder = Pick<ProviderOrder, "client" | "service" | "detail" | "price" | "area" | "extras" | "external"> & {
  id?: string;
  startDate: string;
  endDate: string;
  sessions: number;
};

function OrderCardTags({ order, areaIcon = asset("area.svg") }: { order: Pick<ProviderOrder, "area" | "extras" | "external">; areaIcon?: string }) {
  return <div className="order-card-tags"><span><img src={areaIcon} alt="" />{order.area}</span><span>+{order.extras} dodatkowe usługi</span>{order.external ? <span className="order-card-external">Zewnętrzne</span> : null}</div>;
}

export function ProviderMultiSessionOrderCard({ order, href }: { order: ProviderMultiSessionOrder; href?: string }) {
  const card = (
    <article className="order-card is-multi-session" aria-label={`Zlecenie wielosesyjne — ${order.client}`}>
      <div className="multi-session-order-dates"><div><span>Początek</span><time>{order.startDate}</time></div><img src={multiSessionAsset("date-arrow.svg")} alt="do" /><div><span>Koniec</span><time>{order.endDate}</time></div></div>
      <div className="order-card-color" />
      <div className="order-card-details">
        <div className="order-card-heading"><div className="multi-session-order-client"><span>{order.client}</span><OrderCardTags order={order} areaIcon={multiSessionAsset("area.svg")} /></div><strong>{order.price}</strong></div>
        <div className="order-card-footer"><div className="order-card-service"><span>{order.service} · <span>{order.detail}</span></span></div><span className="multi-session-order-count"><img src={multiSessionAsset("sessions.svg")} alt="" /><span>Sesje</span><span>{order.sessions}</span></span></div>
      </div>
    </article>
  );
  return href ? <Link href={href} className="multi-session-order-link">{card}</Link> : card;
}

export function ProviderOrderCard({ order }: { order: ProviderOrder }) {
  const card = (
    <article className={`order-card${order.cancelled ? " is-cancelled" : ""}`}>
      <div className="order-card-client">
        <div className="order-card-time"><span>{order.start}</span><img src={asset("time-arrow.svg")} alt="do" /><span>{order.end}</span></div>
        <span>{order.client}</span>
      </div>
      <div className="order-card-color" />
      <div className="order-card-details">
        <div className="order-card-heading">
          <div className="order-card-service"><span>{order.service} · <span>{order.detail}</span></span><div className="order-card-employees" aria-label={`${order.employees.length} przypisanych pracowników`}>{order.employees.map(employee => <img key={employee} src={asset(`employee-${employee}.png`)} alt="" />)}</div></div>
          <strong>{order.price}</strong>
        </div>
        <div className="order-card-footer">
          <OrderCardTags order={order} />
          {order.cancelled ? <span className="order-card-cancelled">Odwołane<img src={asset("cancelled.svg")} alt="" /></span> : null}
        </div>
      </div>
    </article>
  );
  return order.id ? <Link href={`/orders/${order.id}/edit`} className="provider-order-edit-link" aria-label={`Edytuj zamówienie: ${order.client}, ${order.start}–${order.end}`}>{card}</Link> : card;
}
