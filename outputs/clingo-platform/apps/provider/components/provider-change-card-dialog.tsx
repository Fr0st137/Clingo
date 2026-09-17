"use client";

import { useId, useState } from "react";
import { ProviderModal } from "./provider-modal";
import { ProviderPaymentButton } from "./provider-payment-button";
import { SettingsField } from "./provider-settings-fields";

const asset = (name: string) => `/figma-assets/payment-methods/change-card/${name}`;

export function ProviderChangeCardDialog() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <ProviderPaymentButton aria-haspopup="dialog" onClick={() => setOpen(true)}>Zmień kartę na inną</ProviderPaymentButton>
      {open ? <ProviderModal titleId={titleId} descriptionId={descriptionId} onClose={() => setOpen(false)} className="payment-change-card-modal">
        <form className="payment-change-card-form" autoComplete="off" data-figma-node="2042:2308" onSubmit={event => event.preventDefault()}>
          <div className="payment-change-card-heading">
            <h2 id={titleId}>Zmień na inną</h2>
            <p id={descriptionId}>kartę debetową lub kredytową</p>
          </div>
          <SettingsField className="payment-change-card-field payment-card-number-field" label="Numer karty" readOnly={false} inputMode="numeric" autoComplete="off" autoFocus maxLength={23}
            labelAdornment={<span className="payment-card-brands"><img src={asset("visa.svg")} alt="Visa" /><img src={asset("mastercard.svg")} alt="Mastercard" /><img src={asset("american-express.svg")} alt="American Express" /></span>}
            suffix={<img className="payment-card-number-icon" src={asset("credit-card.svg")} alt="" />} />
          <div className="payment-change-card-pair">
            <SettingsField className="payment-change-card-field" label="Data ważności" readOnly={false} inputMode="numeric" autoComplete="off" maxLength={7} />
            <SettingsField className="payment-change-card-field" label="CVV" password readOnly={false} inputMode="numeric" autoComplete="off" maxLength={4}
              labelAdornment={<img className="payment-card-cvv-info" src={asset("info.svg")} alt="" title="Kod zabezpieczający karty" />} />
          </div>
          <SettingsField className="payment-change-card-field" label="Imię i Nazwisko na karcie" readOnly={false} autoComplete="off" maxLength={100} />
          <div className="payment-change-card-actions">
            <ProviderPaymentButton onClick={() => setOpen(false)}>Anuluj</ProviderPaymentButton>
            <ProviderPaymentButton disabled className="payment-change-card-save">Zapisz</ProviderPaymentButton>
          </div>
        </form>
      </ProviderModal> : null}
    </>
  );
}
