import Link from "next/link";
import type { OrderCardData } from "./order-card";
import { OrderSessionTimeline } from "./order-session-timeline";

const asset = (name: string) => `/figma-assets/order-detail-${name}`;

function Icon({ name, size = 14 }: { name: string; size?: number }) {
  return <img alt="" src={asset(name)} width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />;
}

function addOnImage(label: string) {
  const text = label.toLocaleLowerCase("pl-PL");
  if (text.includes("okien")) return asset("windows.png");
  if (text.includes("piekarnik")) return asset("oven.png");
  const icons = [["lodów", "lodowka"], ["naczy", "naczynia"], ["mikrofal", "mikrofalowka"], ["okap", "okap"], ["prasow", "prasowanie"], ["kuwet", "kuweta"], ["szafek", "szafki"], ["szafy", "szafa"]];
  const icon = icons.find(([textPart]) => text.includes(textPart));
  return `/clingo-homepage/assets/icons/${icon ? `addon-${icon[1]}.png` : "services-extra.svg"}`;
}

export function CustomerOrderDetails({ order }: { order: OrderCardData }) {
  const details = order.bookingDetails;
  const multiSession = order.mode === "Wielosesyjne" || (details?.sessions?.length ?? 0) > 1;
  const lines = order.summary?.lines ?? [];
  const area = lines.map(line => line.label.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)/i)?.[1]).find(Boolean);
  const addOns = details?.addOns ?? lines
    .filter(line => !/^(area|travel|base|single|multi|pricing)/i.test(line.id) && !/powierzchni|dojazd|m[²2]/i.test(line.label))
    .map(line => ({ id: line.id, label: line.label.replace(/\s*×\s*\d+\s*$/, ""), quantity: Number(line.label.match(/×\s*(\d+)\s*$/)?.[1] ?? 1) }));
  const inactive = /odwoł|anul|zakoń|wykonane|completed|cancel/i.test(order.status);
  const statusStyle = /odwoł|anul|cancel/i.test(order.status) ? "bg-[#fee2e2] text-[#b52a35]" : inactive ? "bg-[#f4f6f9] text-[#7c8691]" : "bg-[#dcfce7] text-[#34a853]";
  const suffix = `?id=${encodeURIComponent(order.id ?? "")}`;
  const avatar = order.logo === "stepapp" ? "/figma-assets/favorite-stepapp.png" : order.avatar === "klaudia" ? "/figma-assets/order-klaudia.png" : order.avatar === "paulina" ? "/figma-assets/order-paulina.png" : undefined;
  const frequency = details?.frequencyLabel ?? (order.mode === "Jednosesyjne" ? "Jednorazowe" : order.mode);

  return (
    <article className="flex w-full min-w-0 flex-col gap-[30px] rounded-[20px] border border-[#e5e7eb] bg-white p-[25px] text-[14px] text-[#2e3b4c] shadow-[0px_4px_14px_0px_rgba(0,0,0,0.04)]" data-node-id={multiSession ? "5087:8185" : "4981:8348"}>
      <header className="flex flex-wrap items-center justify-between gap-[15px]">
        <h1 className="m-0 text-[20px] font-semibold leading-5">Szczegóły zamówienia</h1>
        {!inactive && order.id ? <div className="flex flex-wrap gap-[15px]">
          {!multiSession && order.actions.includes("Przełóż zlecenie") ? <Link href={`/zamowienia/przeloz${suffix}`} className="rounded-[99px] border border-[#e5e7eb] bg-[#f4f6f9] px-[20px] py-[12px] hover:bg-[#e6edf3]">Przełóż zlecenie</Link> : null}
          {order.actions.includes("Odwołaj zlecenie") ? <Link href={`/zamowienia/odwolaj${suffix}`} className="rounded-[99px] border border-[#e5e7eb] bg-[#f4f6f9] px-[20px] py-[12px] hover:bg-[#e6edf3]">Odwołaj zlecenie</Link> : null}
        </div> : null}
      </header>

      <section className="flex min-w-0 flex-col gap-[15px]" aria-label="Dane zamówienia">
        <div className="flex flex-wrap items-center gap-[10px] text-[12px]">
          <span className={`rounded-[30px] px-[12px] py-[5px] ${statusStyle}`}>{order.status}</span>
          {multiSession ? <span className="rounded-full bg-[#e9f5ff] px-[12px] py-[5px] text-[#0079de]">Wielosesyjne</span> : null}
          {area ? <span className="flex items-center gap-[5px] rounded-full bg-[#f4f6f9] px-[8px] py-[5px] text-[#7c8691]"><Icon name="area.svg" size={12} />{area} m²</span> : null}
          {!multiSession ? <span className="rounded-full bg-[#f4f6f9] px-[8px] py-[5px] text-[#7c8691]">{frequency}</span> : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-[15px]">
          <div className={`flex min-w-0 flex-1 items-center ${multiSession ? "gap-[10px]" : "gap-[15px]"}`}>
            {multiSession && order.logo === "stepapp" ? <span className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-full bg-[#ffd6e6] shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]"><img alt="" src="/figma-assets/order-multi-stepapp.png" width={57} height={16} className="h-[16px] w-[57px] object-contain" /></span> : avatar ? <img alt="" src={avatar} width={multiSession ? 64 : 83} height={multiSession ? 64 : 83} className={`shrink-0 rounded-full object-contain shadow-[0_1px_2px_rgba(0,0,0,0.16)] ${multiSession ? "h-[64px] w-[64px]" : "h-[83px] w-[83px]"}`} /> : <span className="grid h-[83px] w-[83px] shrink-0 place-items-center rounded-full bg-[#f4f6f9] text-xl">{order.provider.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>}
            <div className="grid min-w-0 gap-[5px]">
              <p className="m-0 font-medium">{order.provider}</p>
              {!multiSession ? <p className="m-0 flex flex-wrap items-center gap-[5px]"><Icon name="calendar.svg" />{order.dateLines[0] ?? "Termin do ustalenia"}{order.dateLines.length >= 3 ? <>, {order.dateLines[1]}<Icon name="arrow.svg" />{order.dateLines[2]}</> : order.dateLines[1] ? <><Icon name="arrow.svg" />{order.dateLines[1]}</> : null}</p> : null}
              <p className={`m-0 flex items-start gap-[5px] break-words text-[#7c8691] ${multiSession ? "text-[14px]" : "text-[12px]"}`}><Icon name="map.svg" size={12} />{order.address}</p>
              <p className="m-0 break-words text-[#7c8691]">{order.details}</p>
            </div>
          </div>
          <Link href="/chat" aria-label="Otwórz wiadomości" className="grid h-[41px] w-[41px] shrink-0 place-items-center rounded-[16px] bg-gradient-to-b from-[#f0f2f4] to-[#e7eef4] hover:from-[#e7eef4]"><Icon name="chat.svg" size={21} /></Link>
        </div>
      </section>

      {multiSession ? <OrderSessionTimeline order={order} canReschedule={!inactive && Boolean(order.id) && order.actions.includes("Przełóż zlecenie")} /> : null}

      <section className="grid gap-[15px]">
        <h2 className="m-0 text-[16px] font-medium leading-5">Usługi dodatkowe</h2>
        {addOns.length ? addOns.map(addOn => {
          const units = Number(addOn.label.match(/\((\d+)\s*szt\.?\)/i)?.[1] ?? 1);
          const label = addOn.label.replace(/\s*\(\d+\s*szt\.?\)/i, "");
          return <div className="flex items-center justify-between gap-[15px] rounded-[15px] border border-[#e6edf3] p-[15px]" key={addOn.id}>
            <div className="flex min-w-0 items-center gap-[15px]"><img alt="" src={addOnImage(label)} width={28} height={28} className="h-[28px] w-[28px] shrink-0 object-contain drop-shadow-[-1px_2px_2px_rgba(0,0,0,0.15)]" /><span>{label}</span></div>
            <span className="flex h-[25px] min-w-[70px] shrink-0 items-center justify-center rounded-[10px] bg-[#f4f6f9] px-2 text-[13px] font-medium">{units * addOn.quantity} szt.</span>
          </div>;
        }) : <p className="m-0 rounded-[15px] border border-[#e6edf3] p-[15px] text-[#7c8691]">Nie wybrano usług dodatkowych.</p>}
      </section>

      <section className="grid gap-[15px]">
        <h2 className="m-0 text-[16px] font-medium leading-5">Podsumowanie</h2>
        {order.summary ? <dl className="m-0 grid gap-[8px] rounded-[15px] bg-[#f4f6f9] p-[15px] leading-5">
          {lines.map(line => <div key={line.id} className="flex justify-between gap-[15px]"><dt>{line.label}</dt><dd className="m-0 shrink-0">{line.value}</dd></div>)}
          <div className="flex justify-between gap-[15px] border-t border-[#e6edf3] pt-[10px] font-bold"><dt>Suma</dt><dd className="m-0 shrink-0">{order.summary.total}</dd></div>
        </dl> : <p className="m-0 rounded-[15px] bg-[#f4f6f9] p-[15px] text-[#7c8691]">Brak zapisanego podsumowania kosztów.</p>}
      </section>

      {details?.contactName || details?.contactPhone || details?.notes || details?.invoice ? <section className="grid gap-[15px] border-t border-[#e6edf3] pt-[20px]">
        {details.contactName || details.contactPhone ? <div><h2 className="m-0 text-[16px] font-medium">Kontakt do zamawiającego</h2>{details.contactName ? <p className="mb-0 mt-[10px]">{details.contactName}</p> : null}{details.contactPhone ? <p className="m-0">{details.contactPhone}</p> : null}</div> : null}
        {details.notes ? <div><h2 className="m-0 text-[16px] font-medium">Uwagi do zamówienia</h2><p className="mb-0 mt-[10px] whitespace-pre-wrap break-words">{details.notes}</p></div> : null}
        {details.invoice ? <div><h2 className="m-0 text-[16px] font-medium">Dane do faktury</h2><p className="mb-0 mt-[10px]">{details.invoice.companyName}<br />NIP: {details.invoice.taxId}<br />{details.invoice.address}</p></div> : null}
      </section> : null}
    </article>
  );
}
