import { ProviderShell } from "./provider-shell";
import Link from "next/link";
import { ProviderPageSize } from "./provider-list-controls";
import { ProviderPaymentButton as PaymentButton } from "./provider-payment-button";
import { ProviderChangeCardDialog } from "./provider-change-card-dialog";

const paymentAsset = (name: string) => `/figma-assets/payment-methods/${name}`;

function CurrentPlan() {
  const features = [
    { label: "Ilość dostępnych pracowników", value: "1 pracownik" },
    { label: "Ilość dostępnych ogłoszeń", value: "2 ogłoszenia", info: true },
    { label: "Podbicia", value: "1x podbicie w miesiącu", info: true },
    { label: "Zasięg oferowania usług", value: "Do 100km", info: true }
  ];

  return (
    <section className="payment-current-plan" aria-label="Obecny plan">
      <div className="payment-plan-caption">Obecny plan “Podstawowy”</div>
      <div className="payment-plan-card">
        <div className="payment-plan-banner">
          <h1>Indywidualny</h1>
          <p>49,00 <span>netto / mies.</span></p>
        </div>
        <div className="payment-plan-features">
          <dl>
            {features.map(feature => (
              <div className="payment-plan-feature" key={feature.label}>
                <dt>{feature.label}{feature.info ? <img src={paymentAsset("info.svg")} alt="" /> : null}</dt>
                <dd>{feature.value}</dd>
              </div>
            ))}
          </dl>
          <PaymentButton className="payment-change-plan">Zmień plan</PaymentButton>
        </div>
      </div>
    </section>
  );
}

function PaymentCard() {
  return (
    <section className="payment-summary-card" aria-labelledby="payment-method-title">
      <div className="payment-card-heading"><h2 id="payment-method-title">Metoda płatności</h2><p>Zmień aktualną metodę płatności</p></div>
      <div className="payment-saved-card">
        <div className="payment-card-logo"><img src={paymentAsset("mastercard.png")} alt="Mastercard" /></div>
        <div><strong>Mastercard •••• 9451</strong><span>Data ważności: maj 2027</span></div>
      </div>
      <ProviderChangeCardDialog />
    </section>
  );
}

function BillingDetails() {
  return (
    <section className="payment-summary-card" aria-labelledby="billing-details-title">
      <div className="payment-card-heading"><h2 id="billing-details-title">Dane rozliczeniowe</h2><p>Zaktualizuj dane do Faktury</p></div>
      <dl className="payment-billing-details">
        <div><dt>Imię i nazwisko:</dt><dd>Paulina Jagielska</dd></div>
        <div><dt>Adres e-mail:</dt><dd>paulina.jagielska@gmail.com</dd></div>
        <div><dt>NIP:</dt><dd>----------</dd></div>
      </dl>
      <Link href="/payment-methods/billing" className="payment-button">Zarządzaj danymi</Link>
    </section>
  );
}

function PlanDetails() {
  const details = [
    { icon: "calendar.svg", label: "Plan odnowi się", value: "24 listopad 2025" },
    { icon: "price.svg", label: "Cena", value: "49,99 zł netto/mies." },
    { icon: "employees.svg", label: "Pracownicy", value: "2" }
  ];
  return (
    <section className="payment-plan-details" aria-labelledby="plan-details-title">
      <div className="payment-details-heading"><h2 id="plan-details-title">Szczegóły planu</h2><PaymentButton>Anuluj członkostwo</PaymentButton></div>
      <dl className="payment-detail-list">
        {details.map(detail => (
          <div className="payment-detail" key={detail.label}>
            <span className="payment-detail-icon"><img src={paymentAsset(detail.icon)} alt="" /></span>
            <div><dt>{detail.label}</dt><dd>{detail.value}</dd></div>
          </div>
        ))}
      </dl>
    </section>
  );
}

function InvoiceHistory() {
  return (
    <section className="payment-invoices" aria-label="Historia faktur">
      <div className="payment-invoice-frame">
        <div className="payment-invoice-filters">
          <ProviderPageSize />
          <div className="payment-invoice-search"><img src="/figma-assets/shared/search.svg" alt="" /><span>Numer faktury</span></div>
          <div className="payment-invoice-date"><span>Data ważności faktury</span><img src={paymentAsset("angle.svg")} alt="" /></div>
        </div>
        <table className="payment-invoice-table">
          <thead><tr><th>Opis</th><th>Utworzono</th><th>Status</th><th>Kwota</th><th>Działania</th></tr></thead>
          <tbody>
            {Array.from({ length: 4 }, (_, index) => (
              <tr key={index}>
                <td><div className="payment-invoice-description"><span>Subskrypcja Pakiet - Podstawowy</span><small>04617-23304867</small></div></td>
                <td>23 sierpnia 2025</td>
                <td><span className="payment-paid">Opłacono</span></td>
                <td>49,99 zł</td>
                <td><PaymentButton className="payment-download-invoice">Pobierz fakturę</PaymentButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ProviderPaymentMethodsPage() {
  return (
    <ProviderShell figmaNode="2008:1824" paymentsActive>
      <div className="payment-content">
        <div className="payment-content-scroll">
          <div className="payment-dashboard">
            <div className="payment-overview">
              <CurrentPlan />
              <div className="payment-account-summary"><div className="payment-summary-row"><PaymentCard /><BillingDetails /></div><PlanDetails /></div>
            </div>
            <InvoiceHistory />
          </div>
        </div>
      </div>
    </ProviderShell>
  );
}
