import Link from "next/link";

const asset = (name: string) => `/figma-assets/order-history/${name}`;

export function ProviderBackLink({ href }: { href: string }) {
  return <Link className="provider-back-link" href={href}><img src={asset("back.svg")} alt="" />Powrót</Link>;
}

export function ProviderPageSize({ suffix, className = "" }: { suffix?: string; className?: string }) {
  return <div className={`provider-page-size ${className}`}><span>Pokaż</span><button type="button" disabled aria-label="Liczba pozycji na stronie: 15">15<img src={asset("page-size.svg")} alt="" /></button>{suffix ? <span>{suffix}</span> : null}</div>;
}

export function ProviderPagination() {
  return <nav className="provider-pagination" aria-label="Strony listy zamówień">{[1, 2, 3, 4].map(page => <button key={page} type="button" disabled className={page === 1 ? "is-active" : ""} aria-current={page === 1 ? "page" : undefined}>{page}</button>)}<img className="provider-pagination-ellipsis" src={asset("ellipsis.svg")} alt="…" /><button type="button" disabled>9</button><button type="button" disabled className="provider-pagination-next">Następna<img src={asset("next.svg")} alt="" /></button></nav>;
}
