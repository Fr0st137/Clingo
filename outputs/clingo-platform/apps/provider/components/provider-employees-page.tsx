import Link from "next/link";
import { ProviderShell } from "./provider-shell";
import { employeeWorkDays, ProviderWorkdayRow } from "./provider-workday-row";

const employeesAsset = (name: string) => `/figma-assets/employees/${name}`;
const sharedAsset = (name: string) => `/figma-assets/shared/${name}`;

const employees = [
  { name: "Paulina Jagielska", avatar: "paulina.png", active: true },
  { name: "Beata Kaszwabendzka", avatar: "beata.png", active: false }
] as const;

function EmployeeList() {
  return (
    <section className="employees-list-panel" aria-label="Lista pracowników">
      <div className="employees-list-toolbar">
        <div className="employee-search"><img src={sharedAsset("search.svg")} alt="" /><span>Szukaj pracownika</span></div>
        <Link href="/employees/add" className="employee-add-button">Dodaj<img src={employeesAsset("plus.svg")} alt="" /></Link>
      </div>
      <div className="employee-rows">
        {employees.map(employee => (
          <article className={`employee-row${employee.active ? " is-active" : ""}`} key={employee.name}>
            <div><img src={employeesAsset(employee.avatar)} alt="" /><span>{employee.name}</span></div>
            <img className="employee-chevron" src={employeesAsset("chevron.svg")} alt="" />
          </article>
        ))}
      </div>
    </section>
  );
}

function EmployeeProfile() {
  return (
    <section className="employee-profile-card" aria-label="Paulina Jagielska">
      <div className="employee-profile-top">
        <span />
        <img className="employee-main-avatar" src={employeesAsset("paulina.png")} alt="Paulina Jagielska" />
        <Link href="/employees/edit" className="employee-edit" aria-label="Edytuj pracownika — Paulina Jagielska"><img src={employeesAsset("pencil.svg")} alt="" /></Link>
      </div>
      <h1>Paulina Jagielska</h1>
      <div className="employee-contacts"><span>+48 547 658 236</span><span>paulina.jagielska@gmail.com</span></div>
      <strong className="employee-services-title">Realizowane usługi</strong>
      <div className="employee-services">
        <article className="employee-service is-blue"><strong>Sprzątanie obiektów</strong><span>Mieszkań i domów</span></article>
        <article className="employee-service is-brown"><strong>Sprzątanie obiektów</strong><span>Biur i lokali użytkowych</span></article>
      </div>
    </section>
  );
}

function EmployeeSchedule() {
  return (
    <section className="employee-schedule-card" aria-label="Grafik pracownika">
      <div className="employee-schedule-heading">
        <strong>Grafik pracownika</strong>
        <span>Pokaż grafik<img src={employeesAsset("schedule.svg")} alt="" /></span>
      </div>
      <div className="workdays">{employeeWorkDays.map(day => <ProviderWorkdayRow {...day} key={day.day} />)}</div>
      <p className="weekly-hours">Łączna ilość godzin w tygodniu: <strong>72h</strong></p>
    </section>
  );
}

export function ProviderEmployeesPage() {
  return (
    <ProviderShell active="Pracownicy" figmaNode="5601:9221">
      <div className="employees-content"><EmployeeList /><EmployeeProfile /><EmployeeSchedule /></div>
    </ProviderShell>
  );
}
