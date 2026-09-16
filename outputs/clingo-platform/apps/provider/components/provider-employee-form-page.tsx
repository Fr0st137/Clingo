import { ProviderBackLink } from "./provider-list-controls";
import { SettingsField } from "./provider-settings-fields";
import { ProviderShell } from "./provider-shell";
import { ProviderToggle } from "./provider-toggle";
import { employeeWorkDays, ProviderWorkdayRow } from "./provider-workday-row";

const asset = (name: string) => `/figma-assets/employees/add/${name}`;
const editAsset = (name: string) => `/figma-assets/employees/edit/${name}`;

type EmployeeFormMode = "add" | "edit";

const referenceEmployee = { name: "Paulina Jagielska", phone: "578 354 223", email: "paulina.jagielska@gmail.com" };

function EmployeePreference({ title, description, checkbox = false }: { title: string; description: string; checkbox?: boolean }) {
  return <div className="employee-preference"><div className="employee-preference-control">{checkbox ? <button type="button" disabled role="checkbox" aria-checked="true" aria-label={title} className="employee-calendar-checkbox"><img src={asset("check.svg")} alt="" /></button> : <ProviderToggle label={title} checked />}</div><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function EmployeeDetailsForm({ mode }: { mode: EmployeeFormMode }) {
  const editing = mode === "edit";
  const dropdown = <img className="employee-select-arrow" src={asset("select.svg")} alt="" />;
  return (
    <section className="employee-form-panel employee-details-form" aria-label={editing ? "Dane pracownika" : "Dane nowego pracownika"}>
      <div className={`employee-avatar-placeholder${editing ? " has-photo" : ""}`}><img src={editing ? editAsset("avatar.png") : asset("avatar.svg")} alt={editing ? referenceEmployee.name : ""} /><button type="button" disabled aria-label={editing ? "Zmień zdjęcie pracownika" : "Dodaj zdjęcie pracownika"}><img src={editing ? editAsset("avatar-edit.svg") : asset("avatar-plus.svg")} alt="" /></button></div>
      <SettingsField className="employee-form-field" label="Imię i nazwisko" value={editing ? referenceEmployee.name : undefined} />
      <SettingsField className="employee-form-field" label="Numer telefonu" type="tel" value={editing ? referenceEmployee.phone : undefined} placeholder="Wpisz numer..." prefix={<span className="employee-phone-prefix"><img src={asset("poland.png")} alt="Polska" /><span>+48</span>{dropdown}</span>} />
      <SettingsField className="employee-form-field" label="Adres e-mail" type="email" value={editing ? referenceEmployee.email : undefined} placeholder="Wpisz adres..." prefix={<img className="employee-mail-icon" src={asset("mail.svg")} alt="" />} />
      {!editing ? <EmployeePreference title="Utwórz konto i prześlij zaproszenie" description="Przesłany zostanie pracownikowi link aktywacyjny do konta." /> : null}
      <SettingsField className="employee-form-field employee-permissions" label="Poziom uprawnień" value="Pracownik" suffix={dropdown} />
      <EmployeePreference title="Pokazuj pracownika w kalendarzu" description="Pracownika będzie przypisywany do zleceń." checkbox />
    </section>
  );
}

function EmployeeFormHeading({ title, description }: { title: string; description: string }) {
  return <div className="employee-form-heading"><h2>{title}</h2><p>{description}</p></div>;
}

function EmployeeServiceOption({ label, nested = false, checked = false }: { label: string; nested?: boolean; checked?: boolean }) {
  return <button type="button" disabled role="checkbox" aria-checked={checked} className={`employee-service-option${nested ? " is-nested" : ""}${checked ? " is-checked" : ""}`}><span>{label}</span><i /></button>;
}

function EmployeeServicesForm({ mode }: { mode: EmployeeFormMode }) {
  const checked = mode === "edit";
  return <section className="employee-form-panel employee-services-form" aria-label="Przypisz usługi"><EmployeeFormHeading title="Przypisz usługi" description="Wybierz usługi, które będą realizowane przez pracownika." /><div className="employee-service-options"><EmployeeServiceOption label="Wszystkie rodzaje usług" checked={checked} /><div className="employee-service-group"><div className="employee-service-group-heading"><img src={asset("broom.png")} alt="" /><h3>Sprzątanie obiektów</h3></div><EmployeeServiceOption label="Mieszkań i domów" nested checked={checked} /><EmployeeServiceOption label="Biur i lokali użytkowych" nested checked={checked} /></div></div></section>;
}

function EmployeeScheduleForm() {
  return <section className="employee-form-panel employee-schedule-form" aria-label="Ustaw grafik pracownika"><EmployeeFormHeading title="Ustaw grafik pracownika" description="Są to dni i godziny, w których system będzie liczył pracownika jako dostępnego." /><div className="employee-configure-workdays">{employeeWorkDays.map(day => <ProviderWorkdayRow {...day} configure key={day.day} />)}<p className="weekly-hours">Łączna ilość godzin w tygodniu: <strong>72h</strong></p></div></section>;
}

export function ProviderEmployeeFormPage({ mode = "add" }: { mode?: EmployeeFormMode }) {
  const editing = mode === "edit";
  return <ProviderShell active="Pracownicy" figmaNode={editing ? "5879:10140" : "4049:5309"}><div className="employee-form-content"><div className={`employee-form-toolbar${editing ? " is-edit" : ""}`}><ProviderBackLink href="/employees" /><div className="employee-form-actions">{editing ? <button type="button" disabled className="employee-delete-button">Usuń pracownika<img src={editAsset("trash.svg")} alt="" /></button> : null}<button type="button" disabled className="employee-save-button">Zapisz</button></div></div><div className="employee-form-columns"><EmployeeDetailsForm mode={mode} /><EmployeeServicesForm mode={mode} /><EmployeeScheduleForm /></div></div></ProviderShell>;
}
