import { ArrowRight, CalendarCheck, Check, ChevronLeft, ChevronRight, Mail, Smartphone } from "lucide-react";
import { OrderHeader } from "./order-header";
import { OrderProcessShell } from "./order-process-shell";

const weekDays = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];
const calendarDays = [
  { day: 29, outside: true },
  { day: 30, outside: true },
  ...Array.from({ length: 31 }, (_, index) => ({ day: index + 1, outside: false })),
  ...Array.from({ length: 9 }, (_, index) => ({ day: index + 1, outside: true }))
];
const availableDays = new Set([14, 15, 17, 18, 20, 22, 23, 24, 25, 27, 28, 30, 31]);
const limitedDays = new Set([11, 16, 21, 29]);
const timeSlots = [
  "08:00",
  "08:15",
  "08:30",
  "08:45",
  "09:00",
  "09:15",
  "09:30",
  "09:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
  "11:15",
  "11:30",
  "11:45",
  "12:00",
  "12:15",
  "12:30",
  "12:45"
];

function ProviderLine({ name = "Paulina Jagielska", size = 41 }: { name?: string; size?: 41 | 53 }) {
  return (
    <div className="flex min-w-0 items-center gap-[10px]">
      <div
        className="relative shrink-0 overflow-hidden rounded-[30px] shadow-[0_1px_2px_rgba(0,0,0,0.16)]"
        style={{ height: size, width: size }}
      >
        <img alt="" className="h-full w-full object-cover" src="/figma-assets/order-paulina.png" />
        <span className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]" />
      </div>
      <div className="min-w-0">
        <p className="m-0 truncate text-[14px] font-medium leading-5 text-[#2e3b4c]">{name}</p>
        <p className="m-0 truncate text-[14px] font-normal leading-5 text-[#7c8691]">
          Sprzątanie obiektów <span className="font-medium">·</span> Mieszkań i domów
        </p>
      </div>
    </div>
  );
}

function CalendarCard() {
  return (
    <section className="box-border min-w-0 w-full overflow-hidden rounded-[20px] bg-white p-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.04),0_4px_6px_-4px_rgba(0,0,0,0.1)] xl:w-[540px]">
      <header className="flex h-[48px] items-center justify-between border-b border-[#e5e7eb] px-[24px]">
        <button aria-label="Poprzedni miesiąc" className="grid h-8 w-8 place-items-center rounded-lg text-[#2e3b4c]" type="button">
          <ChevronLeft className="h-[14px] w-[14px]" strokeWidth={1.8} />
        </button>
        <h2 className="m-0 text-[14px] font-semibold leading-5 text-[#2e3b4c]">Październik 2025</h2>
        <button aria-label="Następny miesiąc" className="grid h-8 w-8 place-items-center rounded-lg text-[#2e3b4c]" type="button">
          <ChevronRight className="h-[14px] w-[14px]" strokeWidth={1.8} />
        </button>
      </header>

      <div className="grid grid-cols-7 px-[16px] py-[12px]">
        {weekDays.map((day) => (
          <span className="text-center text-[12px] font-medium uppercase leading-4 text-[#6b7280]" key={day}>
            {day}
          </span>
        ))}
      </div>

      <div className="grid h-[360px] grid-cols-7 grid-rows-6 overflow-hidden rounded-[10px] bg-[#f4f6f9]">
        {calendarDays.map(({ day, outside }, index) => {
          const selected = !outside && day === 13;
          const available = !outside && availableDays.has(day);
          const limited = !outside && limitedDays.has(day);

          return (
            <button
              aria-label={`${day} ${outside ? "poza bieżącym miesiącem" : "października"}`}
              className={[
                "relative flex items-center justify-center border-b border-r border-[#e5e7eb] text-[14px] leading-5",
                index % 7 === 6 ? "border-r-0" : "",
                index >= 35 ? "border-b-0" : "",
                outside ? "text-[#d1d5db]" : "text-[#7c8691]",
                selected ? "m-[5px] rounded-[10px] border-0 bg-[#0079de] font-medium text-white" : ""
              ].join(" ")}
              key={`${index}-${day}`}
              type="button"
            >
              {day}
              {available && !selected ? <span className="absolute bottom-[12px] h-px w-[16px] bg-[#36a269]" /> : null}
              {limited && !selected ? <span className="absolute bottom-[12px] h-px w-[16px] bg-[#d13239]" /> : null}
              {!outside && day === 11 ? <span className="absolute right-[18px] top-[16px] h-[5px] w-[5px] rounded-full bg-[#0079de]" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TimePicker() {
  return (
    <section className="grid min-w-0 w-full gap-[20px] xl:w-[540px]">
      <div className="box-border flex h-[71px] min-w-0 w-full items-center justify-between rounded-[20px] border border-[#e5e7eb] bg-white p-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
        <ProviderLine />
        <span className="shrink-0 rounded-[99px] bg-[#f0f2f4] px-[10px] py-1 text-[14px] text-[#7c8691]">3h 15 minut</span>
      </div>

      <div className="box-border flex h-[51px] min-w-0 w-full items-center rounded-[30px] border border-[#e5e7eb] bg-[#f4f6f9] p-[7px] shadow-[0_4px_7px_rgba(0,0,0,0.04)]">
        {['Rano', 'Południe', 'Wieczór'].map((label, index) => (
          <button
            className={[
              "h-[37px] flex-1 rounded-[30px] text-[14px] font-medium",
              index === 0 ? "bg-white text-[#0079de] shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "text-[#2e3b4c]"
            ].join(" ")}
            key={label}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid min-w-0 w-full grid-cols-4 gap-2">
        {timeSlots.map((time, index) => {
          const selected = time === "11:00";
          const disabled = index < 11;

          return (
            <button
              className={[
                "h-[46px] rounded-[30px] border text-[14px] shadow-[0_1px_7px_rgba(0,0,0,0.04)]",
                selected
                  ? "border-[#0079de] bg-[#0079de] font-medium text-white"
                  : disabled
                    ? "border-[#e5e7eb] bg-[#f4f6f9] text-[#9ca3af]"
                    : "border-[#e5e7eb] bg-white text-[#2e3b4c]"
              ].join(" ")}
              key={time}
              type="button"
            >
              {time}
            </button>
          );
        })}
      </div>

      <button className="ml-auto h-[48px] w-full rounded-[30px] bg-[#0079de] text-[14px] font-medium text-white sm:w-[196px]" type="button">
        Przejdź dalej
      </button>
    </section>
  );
}

export function StaticOrderDateScreen() {
  return (
    <OrderProcessShell activeStep={1}>
      <div className="mx-auto grid min-w-0 w-full max-w-[1200px] gap-[20px] xl:grid-cols-[540px_540px] xl:justify-between" data-node-id="781:626">
        <CalendarCard />
        <TimePicker />
      </div>
    </OrderProcessShell>
  );
}

function SummarySection({ children, title, action }: { action?: string; children: React.ReactNode; title: string }) {
  return (
    <section className="grid gap-[15px] rounded-[30px] border border-[#e6edf3] bg-white p-[30px] shadow-[0_0_14px_rgba(0,0,0,0.04)]">
      <header className="flex items-center justify-between px-0.5">
        <h2 className="m-0 text-[20px] font-medium leading-6 text-[#111827]">{title}</h2>
        {action ? (
          <button className="border-0 bg-transparent p-0 text-[14px] font-medium text-[#0079de]" type="button">
            {action}
          </button>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function FloatingStaticField({ children, error = false, label }: { children: React.ReactNode; error?: boolean; label: string }) {
  return (
    <div className={[
      "relative flex h-[52px] min-w-0 flex-1 items-center justify-between rounded-[30px] border px-[20px] text-[14px]",
      error ? "border-[#d13239] bg-white" : "border-[#e5e7eb] bg-[#f9fafb]"
    ].join(" ")}>
      <span className={[
        "absolute left-[19px] top-[-13px] rounded-[10px] px-1 py-0.5 text-[#2e3b4c]",
        error ? "bg-white" : "bg-gradient-to-t from-[#f9fafb] to-white"
      ].join(" ")}>
        {label}
      </span>
      {children}
    </div>
  );
}

const orderLines = [
  ["Powierzchnia (62m²)", "93 zł"],
  ["Mycie piekarnika (1 szt.)", "24 zł"],
  ["Mycie okien (4 szt.)", "48 zł"]
];

export function StaticOrderSummaryScreen() {
  return (
    <OrderProcessShell activeStep={2}>
      <div className="mx-auto grid w-full max-w-[1200px] items-start gap-[20px] xl:grid-cols-[780px_400px]" data-node-id="1079:1322">
        <div className="grid gap-[20px]">
          <SummarySection title="Adres realizacji">
            <div className="grid gap-[20px] md:grid-cols-2">
              <FloatingStaticField error label="Numer mieszkania">
                <span className="text-[#9ca3af]">Wpisz numer, jeśli dotyczy...</span>
              </FloatingStaticField>
              <FloatingStaticField label="Adres">
                <span className="truncate text-[#2e3b4c]">Barona 20A, 02-271 Warszawa</span>
                <button className="ml-3 shrink-0 border-0 bg-transparent p-0 font-medium text-[#0079de]" type="button">Edytuj</button>
              </FloatingStaticField>
            </div>
          </SummarySection>

          <SummarySection action="Edytuj" title="Termin realizacji">
            <div className="flex min-h-[63px] items-center justify-between gap-4 rounded-[15px] border border-[#e5e7eb] bg-[#f9fafb] px-[15px] py-2 text-[14px] text-[#2e3b4c]">
              <span>12 października 2025</span>
              <div className="flex items-center gap-[5px]">
                <span>12:30</span>
                <span className="grid justify-items-center px-[9px] text-[12px] text-[#7c8691]">
                  3h 15min
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span>15:45</span>
              </div>
            </div>
          </SummarySection>

          <SummarySection title="Zamówienie">
            <div className="grid gap-[18px]">
              {orderLines.map(([label, price]) => (
                <div className="flex items-center justify-between border-b border-[#e5e7eb] px-0.5 pb-[8px] text-[14px] text-[#2e3b4c]" key={label}>
                  <span>{label}</span>
                  <span className="font-medium">{price}</span>
                </div>
              ))}
            </div>
          </SummarySection>

          <SummarySection title="Uwagi do zamówienia">
            <div className="h-[111px] rounded-[15px] border border-[#e5e7eb] bg-white p-[15px] text-[14px] text-[#9ca3af]">
              Wpisz jeżeli masz jakieś dodatkowe uwagi...
            </div>
          </SummarySection>
        </div>

        <aside className="grid gap-[20px]">
          <section className="grid gap-[20px] rounded-[30px] border border-[#e6edf3] bg-white p-[30px] shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
            <ProviderLine name="Stepapp" size={53} />
            <div className="flex items-center justify-between rounded-[15px] border border-[#e5e7eb] p-[15px] text-[16px] font-bold text-[#2e3b4c]">
              <span>Suma</span>
              <span>165 zł</span>
            </div>
            <div className="rounded-[15px] bg-[#f4f6f9] p-[15px] text-[14px] leading-[22px] text-[#2e3b4c]">
              <strong>UWAGA!</strong>
              <br />
              Rozliczenie odbywa się bezpośrednio z Wykonawcą (poza platformą), a szczegóły usługi możesz ustalić po złożeniu zamówienia.
            </div>
            <button className="h-[48px] w-full rounded-[30px] bg-[#0079de] text-[14px] font-medium text-white" type="button">
              Potwierdź i zamów
            </button>
          </section>

          <section className="rounded-[30px] border border-[#e6edf3] bg-white/60 p-[30px] text-[14px] leading-[22px] text-[#2e3b4c] shadow-[0_0_14px_rgba(0,0,0,0.04)]">
            Finalizując zamówienie, akceptujesz <u>Regulamin</u>, <u>Politykę prywatności</u> oraz <u>Standardy usług</u> dla wybranego typu usługi. W związku z realizacją rezerwacji będziemy wysyłać Ci wiadomości SMS oraz e-mail z powiadomieniami dotyczącymi zarezerwowanej usługi.
          </section>
        </aside>
      </div>
    </OrderProcessShell>
  );
}

const confirmationItems = [
  { icon: Mail, text: <>Potwierdzenie przesłane<br />na Twój adres e-mail</> },
  { icon: CalendarCheck, text: <>Zamówienie zapisane<br />w panelu „Moje konto”</> },
  { icon: Smartphone, text: <>Otrzymasz przypomnienie<br />SMS przed realizacją</> }
];

export function StaticOrderConfirmationScreen() {
  return (
    <>
      <OrderHeader />
      <main className="relative z-10 mx-auto box-border w-full max-w-[1200px] px-4 pb-[60px] pt-[80px] md:px-0" data-node-id="5303:10099">
        <section className="flex min-h-[831px] w-full flex-col items-center gap-[40px] rounded-[30px] bg-[radial-gradient(ellipse_at_center,#ffffff_0%,rgba(255,255,255,0.86)_52%,rgba(255,255,255,0)_100%)] px-4 py-[100px]">
          <div className="grid justify-items-center gap-[25px] text-center">
            <div className="relative grid h-[154px] w-[250px] place-items-center">
              <span className="absolute h-[130px] w-[130px] rotate-[-12deg] rounded-[42%_58%_56%_44%/52%_43%_57%_48%] border border-[#d8efff] bg-[radial-gradient(circle_at_55%_45%,#ffffff_0%,#f3fbff_55%,#dff4ff_100%)] shadow-[inset_0_0_28px_rgba(0,121,222,0.08)]" />
              <Check className="relative h-[64px] w-[64px] text-[#66c7ff] drop-shadow-[0_8px_12px_rgba(0,121,222,0.18)]" strokeWidth={5} />
            </div>
            <div>
              <h1 className="m-0 text-[24px] font-semibold leading-[34px] text-[#111827]">Zamówienie potwierdzone</h1>
              <p className="m-0 mt-[15px] max-w-[650px] text-[14px] leading-5 text-[#111827]">
                Wykonawca może się z Tobą kontaktować w celu ustalenia szczegółów zlecenia.
                <br />
                Posiadając aplikację na smartphonie otrzymasz powiadomienia o wiadomościach.
              </p>
            </div>
          </div>

          <button className="h-[52px] w-[300px] rounded-[99px] bg-[#0079de] text-[14px] font-medium text-white" type="button">
            Gotowe
          </button>

          <div className="grid w-full max-w-[800px] gap-5 md:grid-cols-[1fr_1px_1fr_1px_1fr] md:items-center">
            {confirmationItems.map(({ icon: Icon, text }, index) => (
              <div className="contents" key={index}>
                <div className="flex items-center gap-[15px]">
                  <span className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-[#bce0ff] text-[#0079de]">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <p className="m-0 text-[14px] font-medium leading-5 text-[#2e3b4c]">{text}</p>
                </div>
                {index < confirmationItems.length - 1 ? <span className="hidden h-[54px] w-px bg-[#dce0e3] md:block" /> : null}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
