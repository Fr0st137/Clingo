export type OrderSummaryData = {
  duration: string;
  lines: Array<{ id: string; label: string; value: string }>;
  total: string;
};

export const defaultOrderSummary: OrderSummaryData = {
  duration: "3 godziny 15 minut",
  lines: [
    { id: "area", label: "Powierzchnia (62m²)", value: "93 zł" },
    { id: "travel", label: "Dojazd do lokalizacji", value: "0 zł" },
    { id: "oven", label: "Mycie piekarnika (1 szt.)", value: "24 zł" },
    { id: "windows", label: "Mycie okien (4 szt.)", value: "48 zł" }
  ],
  total: "165 zł"
};

export function OrderSummaryCard({
  actionHref = "/zamowienie/potwierdzenie",
  summary = defaultOrderSummary
}: {
  actionHref?: string;
  summary?: OrderSummaryData;
}) {
  return (
    <aside className="grid w-full max-w-[380px] gap-[10px] xl:w-[380px]" data-node-id="6066:10463">
      <section className="h-[449px] w-full rounded-[32px] border border-[#e5e7eb] bg-white px-[30px] pt-[30px] shadow-[0px_4px_18px_0px_rgba(15,23,42,0.08)] xl:w-[380px]">
        <h2 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Podsumowanie</h2>

        <section className="mt-[20px] h-[87px] w-full rounded-[15px] bg-[#f7f9fc] px-[15px] pt-[15px] xl:w-[320px]">
          <p className="m-0 text-[14px] font-normal leading-5 text-[#2e3b4c]">Szacowany czas realizacji</p>
          <div className="mt-[5px] flex h-[32px] w-[167px] items-center rounded-[10px] border border-[#e5e7eb] bg-white px-[20px]">
            <span className="whitespace-nowrap text-[14px] font-normal leading-5 text-[#2e3b4c]">{summary.duration}</span>
          </div>
        </section>

        <section className="mt-[20px] h-[172px] w-full rounded-[15px] bg-[#f7f9fc] px-[15px] pt-[15px] xl:w-[320px]">
          <dl className="m-0 grid w-full gap-[8px] text-[14px] font-normal leading-5 text-[#2e3b4c] xl:w-[290px]">
            {summary.lines.map((line) => (
              <div className="flex h-[20px] justify-between" key={line.id}>
                <dt>{line.label}</dt>
                <dd className="m-0">{line.value}</dd>
              </div>
            ))}
            <div className="mt-0 flex h-[30px] justify-between border-t border-[#e5e7eb] pt-[10px] font-bold">
              <dt>Suma</dt>
              <dd className="m-0">{summary.total}</dd>
            </div>
          </dl>
        </section>

        <a
          className="mt-[20px] flex h-[46px] w-full items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white xl:w-[320px]"
          href={actionHref}
        >
          Przejdź do zamówienia
        </a>
      </section>

      <section className="min-h-[148px] w-full rounded-[32px] border border-[#e5e7eb] bg-white px-[30px] pb-[30px] pt-[30px] shadow-[0px_4px_18px_0px_rgba(15,23,42,0.08)] xl:h-[148px] xl:w-[380px]">
        <p className="m-0 w-full whitespace-pre-line text-[14px] font-normal leading-[22px] text-[#2e3b4c] xl:w-[320px]">
          <strong>UWAGA!</strong>
          {"\n"}Rozliczenie odbywa się bezpośrednio z Wykonawcą (poza platformą), a szczegóły usługi możesz ustalić po złożeniu zamówienia.
        </p>
      </section>
    </aside>
  );
}
