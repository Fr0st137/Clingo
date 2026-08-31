import type { OfferRequestState } from "../lib/offer-request";

type Props = {
  state: Exclude<OfferRequestState, "ready">;
  area: string;
  duration: string;
  basePrice: string;
  travelPrice: string;
  total: string;
  addOns: Array<{ id: string; label: string; quantity: number; price: string }>;
};

function UnknownValue({ total = false }: { total?: boolean }) {
  return <span aria-label="Brak wyceny" className={`inline-flex rounded-[8px] px-[8px] py-[2px] font-medium ${total ? "bg-white/80" : "bg-[#fff5f5]"}`}>?</span>;
}

export function OfferSummaryUnavailable({ state, area, duration, basePrice, travelPrice, total, addOns }: Props) {
  const missing = state !== "unsupported-location";
  return (
    <section aria-label="Podsumowanie zamówienia" className="flex w-full max-w-[380px] flex-col gap-[15px] rounded-[30px] border border-[#e5e7eb] bg-white p-[30px] text-[14px] leading-5 text-[#2e3b4c] shadow-[0_0_14px_0_rgba(0,0,0,0.04)] xl:w-[380px]" data-node-id={missing ? "6270:11409" : "6276:11520"} data-offer-state={state}>
      <h2 className="m-0 text-[20px] font-bold leading-6">Podsumowanie</h2>

      <div className={`flex flex-col items-start gap-[10px] rounded-[15px] p-[15px] ${missing ? "bg-[#fff5f5]" : "bg-[#f9fafb]"}`}>
        <p className="m-0 font-semibold">Szacowany czas realizacji</p>
        <div className={`inline-flex min-h-[34px] items-center gap-[8px] rounded-[99px] border border-[#e5e7eb] px-[15px] py-[6px] ${missing ? "bg-white/60 text-[12px] text-[#7c8691]" : "bg-white font-medium text-[#0079de]"}`}>
          {missing ? <><img alt="" width={12} height={12} className="h-[12px] w-[12px] shrink-0" src="/figma-assets/offer-summary-info.svg" />Brak danych</> : duration}
        </div>
      </div>

      <div className="flex flex-col gap-[20px] overflow-hidden rounded-[15px] border border-[#e5e7eb] bg-white">
        <h3 className="m-0 px-[15px] pt-[15px] text-[14px] font-semibold">Usługi podstawowe</h3>
        <dl className="m-0 flex flex-col gap-[10px] px-[15px]">
          <div className="flex items-center justify-between gap-[10px]">
            <dt>Powierzchnia{area ? ` (${area}m²)` : ""}</dt>
            <dd className="m-0 shrink-0">{missing ? <UnknownValue /> : basePrice}</dd>
          </div>
          <div className="flex items-center justify-between gap-[10px]">
            <dt>Dojazd do lokalizacji</dt>
            <dd className="m-0 shrink-0">{missing ? <UnknownValue /> : travelPrice}</dd>
          </div>
        </dl>
        <div className="flex items-center gap-[5px] px-[15px]">
          <h3 className="m-0 shrink-0 text-[14px] font-semibold">Usługi dodatkowe</h3>
          <img alt="" className="h-px min-w-0 flex-1" src="/figma-assets/offer-summary-divider.svg" />
        </div>
        {addOns.length ? (
          <dl className="m-0 grid gap-[10px] px-[15px]">
            {addOns.map(item => <div className="flex justify-between gap-[10px]" key={item.id}><dt>{item.label}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</dt><dd className="m-0 shrink-0">{item.price}</dd></div>)}
          </dl>
        ) : (
          <div className="flex items-center gap-[15px] px-[15px]"><img alt="" width={24} height={24} className="h-[24px] w-[24px] shrink-0" src="/figma-assets/offer-summary-unselected.png" /><p className="m-0">Nie wybrano</p></div>
        )}
        <div className={`flex items-center justify-between rounded-[15px] border border-[#e6edf3] px-[15px] py-[10px] font-bold ${missing ? "bg-[#fff5f5]" : "bg-[#f4f6f9]"}`}>
          <span>Suma</span><span>{missing ? <UnknownValue total /> : total}</span>
        </div>
      </div>

      <div id="offer-summary-notice" role="status" aria-live="polite" className="rounded-[15px] bg-[#fee2e2] p-[15px] leading-[22px]">
        {state === "unknown-area" ? <><strong className="font-semibold">Brak danych o obsługiwanym obszarze,</strong><br />nie możemy jeszcze potwierdzić realizacji pod wskazanym adresem.</> : missing ? <><strong className="font-semibold">Uzupełnij metraż i lokalizację,</strong><br />abyśmy mogli obliczyć koszt usługi, czas realizacji i dostępność terminu.</> : <><strong className="font-semibold">Lokalizacja poza zasięgiem,</strong><br />ten wykonawca nie realizuje usług pod wskazanym adresem.</>}
      </div>
      <button type="button" disabled aria-describedby="offer-summary-notice" className="flex min-h-[46px] w-full cursor-not-allowed items-center justify-center rounded-[30px] bg-[#e5e7eb] px-2 py-[12px] text-[14px] font-semibold leading-[22px] text-[#9ca3af]">Przejdź do zamówienia</button>
    </section>
  );
}
