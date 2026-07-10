import { CalendarDays, Check, Clock3, MapPin } from "lucide-react";
import { PublicShell } from "./public-shell";

const summaryLines = [
  ["Powierzchnia (62m²)", "93 zł"],
  ["Dojazd do lokalizacji", "0 zł"],
  ["Mycie piekarnika (1 szt.)", "24 zł"],
  ["Mycie okien (4 szt.)", "48 zł"]
];

export function OrderSummaryCard({ actionHref = "/zamowienie/potwierdzenie" }: { actionHref?: string }) {
  return (
    <aside className="grid w-[380px] gap-[10px]" data-node-id="6066:10463">
      <section className="h-[449px] w-[380px] rounded-[32px] border border-[#e5e7eb] bg-white px-[30px] pt-[30px] shadow-[0px_4px_18px_0px_rgba(15,23,42,0.08)]">
        <h2 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Podsumowanie</h2>

        <section className="mt-[20px] h-[87px] w-[320px] rounded-[15px] bg-[#f7f9fc] px-[15px] pt-[15px]">
          <p className="m-0 text-[14px] font-normal leading-5 text-[#2e3b4c]">Szacowany czas realizacji</p>
          <div className="mt-[5px] flex h-[32px] w-[167px] items-center rounded-[10px] border border-[#e5e7eb] bg-white px-[20px]">
            <span className="whitespace-nowrap text-[14px] font-normal leading-5 text-[#2e3b4c]">
              3 godziny 15 minut
            </span>
          </div>
        </section>

        <section className="mt-[20px] h-[172px] w-[320px] rounded-[15px] bg-[#f7f9fc] px-[15px] pt-[15px]">
          <dl className="m-0 grid w-[290px] gap-[8px] text-[14px] font-normal leading-5 text-[#2e3b4c]">
            {summaryLines.map(([label, value]) => (
              <div className="flex h-[20px] justify-between" key={label}>
                <dt>{label}</dt>
                <dd className="m-0">{value}</dd>
              </div>
            ))}
            <div className="mt-0 flex h-[30px] justify-between border-t border-[#e5e7eb] pt-[10px] font-bold">
              <dt>Suma</dt>
              <dd className="m-0">165 zł</dd>
            </div>
          </dl>
        </section>

        <a
          className="mt-[20px] flex h-[46px] w-[320px] items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white"
          href={actionHref}
        >
          Przejdź do zamówienia
        </a>
      </section>

      <section className="h-[148px] w-[380px] rounded-[32px] border border-[#e5e7eb] bg-white px-[30px] pt-[30px] shadow-[0px_4px_18px_0px_rgba(15,23,42,0.08)]">
        <p className="m-0 w-[320px] whitespace-pre-line text-[14px] font-normal leading-[22px] text-[#2e3b4c]">
          <strong>UWAGA!</strong>
          {"\n"}Rozliczenie odbywa się bezpośrednio z Wykonawcą (poza platformą), a szczegóły usługi możesz ustalić po złożeniu zamówienia.
        </p>
      </section>
    </aside>
  );
}

function VacuumQuestion() {
  return (
    <section className="h-[68px] w-[540px] rounded-[10px] border border-[#dce6f2] bg-white px-[20px] py-[20px]">
      <label className="flex h-[28px] w-[350px] items-center gap-[15px] text-[14px] font-normal leading-[17px] text-[#2e3b4c]">
        <span className="h-[28px] w-[28px] rounded-[8px] border border-[#dce6f2] bg-white" aria-hidden="true" />
        Czy na zamówieniu potrzebny jest odkurzacz?
      </label>
    </section>
  );
}

function ToggleSwitch({ enabled }: { enabled?: boolean }) {
  return (
    <span className={["relative h-[22px] w-[46px] rounded-[999px]", enabled ? "bg-[#0079de]" : "bg-[#e5e7eb]"].join(" ")}>
      <span className={["absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white", enabled ? "left-[27px]" : "left-[4px]"].join(" ")} />
    </span>
  );
}

function BufferConfiguration() {
  return (
    <section className="w-[800px] rounded-[30px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
      <div className="flex h-[41px] items-start gap-[16px]">
        <ToggleSwitch />
        <div>
          <p className="m-0 text-[14px] font-normal leading-[17px] text-[#2e3b4c]">Bufor między zleceniami</p>
          <p className="mt-[8px] text-[13px] font-normal leading-[16px] text-[#7c8691]">
            Aktywuj, aby ustawić minimalny odstęp czasowy między kolejnymi zleceniami i zapobiec ich planowaniu bezpośrednio jedno po drugim.
          </p>
        </div>
      </div>

      <div className="mt-[48px] flex h-[108px] items-start gap-[16px]">
        <ToggleSwitch enabled />
        <div className="w-full">
          <p className="m-0 text-[14px] font-normal leading-[17px] text-[#2e3b4c]">Bufor między zleceniami</p>
          <p className="mt-[8px] text-[13px] font-normal leading-[16px] text-[#7c8691]">
            Aktywuj, aby ustawić minimalny odstęp czasowy między kolejnymi zleceniami i zapobiec ich planowaniu bezpośrednio jedno po drugim.
          </p>
          <div className="mt-[28px] flex items-center gap-[20px]">
            <span className="h-[22px] w-[3px] rounded-[3px] bg-[#edf2f8]" />
            <span className="text-[14px] font-normal leading-[17px] text-[#2e3b4c]">Czas buforu między zleceniami</span>
            <span className="flex h-[44px] w-[118px] items-center justify-center gap-[16px] rounded-[10px] border border-[#e5e7eb] bg-white text-[14px] leading-5 text-[#2e3b4c]">
              30 min
              <Clock3 className="h-[14px] w-[14px]" strokeWidth={1.8} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CyclicConfiguration() {
  return (
    <section className="w-[800px] rounded-[30px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
      <div className="flex h-[41px] items-start gap-[16px]">
        <ToggleSwitch />
        <div>
          <p className="m-0 text-[14px] font-normal leading-[17px] text-[#2e3b4c]">Usługi cykliczne</p>
          <p className="mt-[8px] text-[13px] font-normal leading-[16px] text-[#7c8691]">
            Zaznacz, jeśli chcesz oferować usługi cykliczne.
          </p>
        </div>
      </div>

      <div className="mt-[210px] flex items-start gap-[16px]">
        <ToggleSwitch enabled />
        <div className="w-full">
          <p className="m-0 text-[14px] font-normal leading-[17px] text-[#2e3b4c]">Usługi cykliczne</p>
          <p className="mt-[8px] text-[13px] font-normal leading-[16px] text-[#7c8691]">
            Zaznacz, jeśli chcesz oferować usługi cykliczne.
          </p>
          <div className="mt-[28px] flex gap-[12px]">
            <span className="h-[22px] w-[3px] rounded-[3px] bg-[#edf2f8]" />
            <div>
              <p className="m-0 text-[14px] leading-[17px] text-[#2e3b4c]">Ustal wysokość rabatu w zależności od częstotliwości.</p>
              <p className="mt-[12px] text-[13px] leading-[16px] text-[#7c8691]">Jeżeli pozostawisz pola puste wszędzie wyświetli się 0%.</p>
              <div className="mt-[14px] grid grid-cols-4 gap-[40px]">
                {[
                  ["-15%", "Raz w tygodniu"],
                  ["-10%", "Raz na 2 tygodnie"],
                  ["-5%", "Raz w miesiącu"],
                  ["-0%", "Jednorazowe"]
                ].map(([value, label]) => (
                  <div className="grid justify-items-center" key={label}>
                    <span className="flex h-[34px] w-[96px] items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white text-[14px] leading-5 text-[#2e3b4c]">
                      {value}
                    </span>
                    <span className="mt-[10px] text-[14px] leading-[17px] text-[#2e3b4c]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderField({ label, value, icon }: { label: string; value: string; icon?: "calendar" | "clock" | "map" }) {
  const Icon = icon === "calendar" ? CalendarDays : icon === "clock" ? Clock3 : icon === "map" ? MapPin : null;

  return (
    <section className="h-[68px] w-full rounded-[15px] border border-[#dce6f2] bg-white px-[20px] py-[14px]">
      <p className="m-0 text-[12px] leading-[16px] text-[#7c8691]">{label}</p>
      <div className="mt-[4px] flex items-center gap-[10px] text-[14px] leading-5 text-[#2e3b4c]">
        {Icon ? <Icon className="h-[16px] w-[16px] text-[#0079de]" strokeWidth={1.8} /> : null}
        <span>{value}</span>
      </div>
    </section>
  );
}

export function OrderCheckoutPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid w-[1200px] grid-cols-[800px_380px] gap-[20px] pb-[60px]">
        <main className="grid gap-[20px]">
          <section className="w-[800px] rounded-[30px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
            <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Zamówienie</h1>

            <div className="mt-[20px] grid grid-cols-2 gap-[15px]">
              <OrderField label="Wykonawca" value="Paulina Jagielska" />
              <OrderField label="Usługa" value="Sprzątanie obiektów · Mieszkań i domów" />
              <OrderField label="Data" value="12 Października 2025" icon="calendar" />
              <OrderField label="Godzina" value="8:45 → 10:30" icon="clock" />
              <div className="col-span-2">
                <OrderField label="Adres" value="Warszawa, Floriańska 48/16" icon="map" />
              </div>
            </div>
          </section>

          <VacuumQuestion />
          <BufferConfiguration />
          <CyclicConfiguration />

          <section className="w-[800px] rounded-[30px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
            <h2 className="m-0 text-[20px] font-bold leading-6 text-[#2e3b4c]">Dodatkowe informacje</h2>
            <div className="mt-[20px] h-[120px] w-[740px] rounded-[15px] border border-[#dce6f2] bg-white p-[15px] text-[14px] leading-5 text-[#7c8691]">
              Informacje dla wykonawcy
            </div>
          </section>
        </main>

        <OrderSummaryCard />
      </section>
    </PublicShell>
  );
}

export function OrderConfirmationPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid w-[800px] gap-[20px] pb-[60px]">
        <section className="grid h-[300px] place-items-center rounded-[32px] border border-[#dce6f2] bg-white px-[30px] shadow-figma">
          <div className="grid justify-items-center">
            <span className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#0079de] text-white">
              <Check className="h-[28px] w-[28px]" />
            </span>
            <h1 className="mt-[25px] text-[24px] font-bold leading-6 text-[#2e3b4c]">Zamówienie zostało złożone</h1>
            <p className="mt-[15px] w-[420px] text-center text-[14px] leading-[22px] text-[#2e3b4c]">
              Szczegóły usługi możesz ustalić po złożeniu zamówienia.
            </p>
            <a className="mt-[25px] flex h-[46px] w-[260px] items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white" href="/zamowienia/szczegoly">
              Szczegóły zlecenia
            </a>
          </div>
        </section>
      </section>
    </PublicShell>
  );
}

export function OrderDetailsPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid w-[1200px] grid-cols-[800px_380px] gap-[20px] pb-[60px]">
        <main className="w-[800px] rounded-[30px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
          <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Szczegóły zlecenia</h1>
          <div className="mt-[20px] grid gap-[15px]">
            <OrderField label="Status" value="Nadchodzące zlecenie" />
            <OrderField label="Wykonawca" value="Paulina Jagielska" />
            <OrderField label="Usługa" value="Sprzątanie obiektów · Mieszkań i domów" />
            <OrderField label="Adres" value="Warszawa, Floriańska 48/16" icon="map" />
            <OrderField label="Termin" value="12 Października 2025, 8:45 → 10:30" icon="calendar" />
          </div>
        </main>
        <OrderSummaryCard actionHref="/zamowienia" />
      </section>
    </PublicShell>
  );
}

export function OrderReschedulePage() {
  return (
    <PublicShell>
      <section className="mx-auto grid w-[1200px] grid-cols-[800px_380px] gap-[20px] pb-[60px]">
        <main className="w-[800px] rounded-[30px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
          <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Przełóż zlecenie</h1>
          <div className="mt-[20px] grid grid-cols-2 gap-[15px]">
            <OrderField label="Aktualny termin" value="12 Października 2025, 8:45 → 10:30" icon="calendar" />
            <OrderField label="Nowy termin" value="17 Października 2025, 8:45 → 10:30" icon="calendar" />
          </div>
          <a className="mt-[20px] flex h-[46px] w-[320px] items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white" href="/zamowienia/szczegoly">
            Przełóż zlecenie
          </a>
        </main>
        <OrderSummaryCard actionHref="/zamowienia/szczegoly" />
      </section>
    </PublicShell>
  );
}

export function OrderCancelPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid w-[800px] gap-[20px] pb-[60px]">
        <section className="rounded-[32px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
          <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Odwołaj zlecenie</h1>
          <p className="mt-[20px] w-[520px] text-[14px] leading-[22px] text-[#2e3b4c]">
            Nadchodzące zlecenie · Paulina Jagielska · Sprzątanie obiektów · Mieszkań i domów
          </p>
          <a className="mt-[25px] flex h-[46px] w-[220px] items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white" href="/zamowienia">
            Odwołaj zlecenie
          </a>
        </section>
      </section>
    </PublicShell>
  );
}

export function AddReviewPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid w-[800px] gap-[20px] pb-[60px]">
        <section className="rounded-[32px] border border-[#dce6f2] bg-white p-[30px] shadow-figma">
          <h1 className="m-0 text-[24px] font-bold leading-6 text-[#2e3b4c]">Dodaj opinię</h1>
          <div className="mt-[20px] h-[120px] w-[740px] rounded-[15px] border border-[#dce6f2] bg-white p-[15px] text-[14px] leading-5 text-[#7c8691]">
            Treść opinii
          </div>
          <a className="mt-[20px] flex h-[46px] w-[220px] items-center justify-center rounded-[100px] bg-[#0079de] text-[15px] font-bold leading-5 text-white" href="/opinie">
            Dodaj opinię
          </a>
        </section>
      </section>
    </PublicShell>
  );
}
