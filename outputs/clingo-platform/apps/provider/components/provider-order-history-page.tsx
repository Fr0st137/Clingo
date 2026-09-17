import { historicalOrders as orders, type HistoricalOrder } from "./provider-orders-data";
import Link from "next/link";
import { ProviderBackLink, ProviderPageSize, ProviderPagination } from "./provider-list-controls";
import { ProviderShell } from "./provider-shell";

const asset = (name: string) => `/figma-assets/order-history/${name}`;
const columns = ["Nr zamówienia", "Klient", "Rodzaj usługi", "Usługa", "Termin początkowy", "Termin końcowy", "Status", "Kwota"];
function OrderHistoryToolbar() {
  return (
    <div className="order-history-toolbar">
      <div className="order-history-title"><ProviderBackLink href="/orders" /><h1 id="order-history-title">Historia zamówień</h1><span>37 wykonanych zamówień</span></div>
      <div className="order-history-filters">
        <ProviderPageSize suffix="Zamówień" />
        <button className="order-history-session-filter" type="button" disabled>Zamówienia jednosesyjne<img src={asset("dropdown.svg")} alt="" /></button>
        <div className="order-history-search"><img src={asset("search.svg")} alt="" /><input aria-label="Szukaj zleceń w historii" placeholder="Szukaj zleceń" readOnly /></div>
      </div>
    </div>
  );
}

function OrderHistoryRow({ order }: { order: HistoricalOrder }) {
  return <tr>{[order.number, order.client, order.category, order.service, order.start, order.end].map((value, i) => <td key={i}><span>{value}</span></td>)}<td><span className="order-history-status">Wykonane<img src={asset("completed.svg")} alt="" /></span></td><td><div className="order-history-price"><span>{order.price}</span><Link href={`/orders/${order.id}/edit`} aria-label={`Edytuj zamówienie ${order.number}`}><img src={asset("details.svg")} alt="" /></Link></div></td></tr>;
}

export function ProviderOrderHistoryPage() {
  return (
    <ProviderShell active="Zlecenia" figmaNode="3931:5531">
      <section className="order-history-content" aria-labelledby="order-history-title">
        <OrderHistoryToolbar />
        <div className="order-history-scroll" role="region" aria-label="Tabela historii zamówień" tabIndex={0}>
          <table className="order-history-table"><thead><tr>{columns.map((column, i) => <th scope="col" key={column}><button type="button" disabled>{column}<img className={i === 4 || i === 5 ? "is-date" : ""} src={asset(i === 4 || i === 5 ? "date-sort.svg" : "sort.svg")} alt="" /></button></th>)}</tr></thead><tbody>{orders.map((order, i) => <OrderHistoryRow key={i} order={order} />)}</tbody></table>
          <ProviderPagination />
        </div>
      </section>
    </ProviderShell>
  );
}
