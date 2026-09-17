import Link from "next/link";
import type { ReactNode } from "react";
import { ProviderShell } from "./provider-shell";

const asset = (name: string) => `/figma-assets/payment-methods/billing/${name}`;

function InvoiceSection({ title, id, actions, children, className = "" }: { title: string; id: string; actions: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`provider-invoice-panel ${className}`} aria-labelledby={id}>
      <div className="provider-invoice-heading"><h2 id={id}>{title}</h2><div className="provider-invoice-actions">{actions}</div></div>
      <div className="provider-invoice-body">{children}</div>
    </section>
  );
}

function InvoiceField({ label, id, description, children }: { label: string; id: string; description: string; children: ReactNode }) {
  return (
    <div className="provider-invoice-field">
      <label htmlFor={id}>{label}</label>
      {children}
      <p id={`${id}-description`}>{description}</p>
    </div>
  );
}

export function ProviderInvoiceDetailsPage() {
  return (
    <ProviderShell figmaNode="6645:11959" paymentsActive>
      <div className="payment-content">
        <div className="payment-content-scroll">
          <div className="provider-invoice-content">
            <InvoiceSection title="Dane do faktury" id="invoice-details-title" actions={<>
              <Link href="/payment-methods" className="provider-invoice-button provider-invoice-back">Cofnij</Link>
              <button type="button" disabled className="provider-invoice-button provider-invoice-save">Zapisz zmiany</button>
            </>}>
              <InvoiceField id="billing-contact-name" label="Imię i nazwisko osoby kontaktowej ds. rozliczeń" description="To imię i nazwisko pojawi się pod Twoją nazwą na fakturze (na przykład nazwą firmy lub podmiotu).">
                <input id="billing-contact-name" aria-describedby="billing-contact-name-description" className="provider-invoice-input" defaultValue="Kajetan Mrówczyński" maxLength={120} />
              </InvoiceField>
              <InvoiceField id="billing-country" label="Adres rozliczeniowy" description="Używamy tej informacji do obliczenia podatku">
                <div className="provider-invoice-input provider-invoice-country">
                  <img src={asset("map.svg")} alt="" />
                  <input id="billing-country" aria-describedby="billing-country-description" defaultValue="Polska" maxLength={80} />
                  <button type="button" disabled aria-label="Usuń adres rozliczeniowy"><img src={asset("clear-country.svg")} alt="" /></button>
                </div>
              </InvoiceField>
              <InvoiceField id="billing-extra-contacts" label="Dodatkowe kontakty do rozliczeń" description="E-maile rozliczeniowe będą wysyłane do osób zarządzających marką, jak również do podanych tutaj dodatkowych kontaktów.">
                <div className="provider-invoice-input provider-invoice-contacts">
                  <span className="provider-invoice-contact-chip">kajdasz9@gmail.com<button type="button" disabled aria-label="Usuń kontakt kajdasz9@gmail.com"><img src={asset("clear-contact.svg")} alt="" /></button></span>
                  <input id="billing-extra-contacts" aria-describedby="billing-extra-contacts-description" type="email" maxLength={254} />
                </div>
              </InvoiceField>
            </InvoiceSection>
            <InvoiceSection title="Numer identyfikacji podatkowej" id="invoice-tax-title" className="provider-invoice-tax" actions={<button type="button" disabled className="provider-invoice-button provider-invoice-add-tax">Dodaj numer identyfikacji podatkowej</button>}>
              <p>Podaj swój numer identyfikacji podatkowej, aby uwzględnić go na fakturach. Możesz też złożyć wniosek o zwolnienie z podatku, jeśli się kwalifikujesz. Jeśli nie masz numeru identyfikacji podatkowej, skontaktuj się z nami i przejdź do zaświadczenia o zwolnieniu z podatku.</p>
            </InvoiceSection>
          </div>
        </div>
      </div>
    </ProviderShell>
  );
}
