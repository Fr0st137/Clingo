import { ProviderEmployeeAvatar } from "./provider-employee-avatar";
import { ProviderBackLink } from "./provider-list-controls";
import { SettingsField } from "./provider-settings-fields";
import { ProviderShell } from "./provider-shell";
import { ProviderToggle } from "./provider-toggle";

const asset = (name: string) => `/figma-assets/employees/add-details/${name}`;

function EmployeeAddDetails() {
  return (
    <section className="employee-form-panel employee-add-details" aria-label="Dane nowego pracownika">
      <ProviderEmployeeAvatar image={asset("avatar.svg")} actionIcon={asset("avatar-plus.svg")} />
      <SettingsField className="employee-form-field" label="Imię i nazwisko" />
      <SettingsField className="employee-form-field" label="Numer telefonu" type="tel" placeholder="Wpisz numer..." prefix={
        <span className="employee-phone-prefix">
          <img src={asset("poland.png")} alt="Polska" /><span>+48</span>
          <img className="employee-select-arrow" src={asset("select.svg")} alt="" />
        </span>
      } />
      <SettingsField className="employee-form-field" label="Adres e-mail" type="email" placeholder="Wpisz adres..." prefix={<img className="employee-mail-icon" src={asset("mail.svg")} alt="" />} />
      <SettingsField className="employee-form-field employee-add-address" label="Miasto" />
      <SettingsField className="employee-form-field employee-add-address" label="Kod pocztowy" />
      <SettingsField className="employee-form-field employee-add-address" label="Numer mieszkania" placeholder="Wpisz numer, jeśli dotyczy..." />
      <SettingsField className="employee-form-field employee-add-address" label="Ulica" />
      <button type="button" disabled className="employee-add-invoice">
        <span><img src={asset("invoice-plus.svg")} alt="" /></span>Dodaj dane do faktury
      </button>
    </section>
  );
}

function EmployeeAddInformation() {
  return (
    <section className="employee-form-panel employee-add-information" aria-label="Informacje o pracowniku">
      <div className="employee-add-block">
        <ProviderToggle label="Zablokuj pracownika" checked={false} />
        <img src={asset("unlock.svg")} alt="" /><span>Zablokuj pracownika</span>
      </div>
      <div className="employee-add-information-heading">
        <h2>Informacje o pracowniku</h2>
        <button type="button" disabled aria-label="Dodaj informacje o pracowniku">Dodaj<img src={asset("add.svg")} alt="" /></button>
      </div>
      <div className="employee-add-empty">
        <img src={asset("empty-information.png")} alt="" />
        <p>Brak informacji o pracowniku</p>
      </div>
    </section>
  );
}

export function ProviderEmployeeAddPage() {
  return (
    <ProviderShell active="Pracownicy" figmaNode="5707:9514">
      <div className="employee-form-content employee-add-content">
        <div className="employee-form-toolbar">
          <ProviderBackLink href="/employees" />
          <button type="button" disabled className="employee-save-button">Zapisz</button>
        </div>
        <div className="employee-add-columns"><EmployeeAddDetails /><EmployeeAddInformation /></div>
      </div>
    </ProviderShell>
  );
}
