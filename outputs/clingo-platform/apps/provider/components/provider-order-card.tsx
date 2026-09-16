const asset = (name: string) => `/figma-assets/orders/${name}`;

export type ProviderOrder = {
  start: string; end: string; client: string; service: string; detail: string;
  price: string; area: string; extras: number;
  employees: ReadonlyArray<"one" | "two">;
  cancelled?: boolean; external?: boolean;
};

export function ProviderOrderCard({ order }: { order: ProviderOrder }) {
  return (
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
          <div className="order-card-tags"><span><img src={asset("area.svg")} alt="" />{order.area}</span><span>+{order.extras} dodatkowe usługi</span>{order.external ? <span className="order-card-external">Zewnętrzne</span> : null}</div>
          {order.cancelled ? <span className="order-card-cancelled">Odwołane<img src={asset("cancelled.svg")} alt="" /></span> : null}
        </div>
      </div>
    </article>
  );
}
