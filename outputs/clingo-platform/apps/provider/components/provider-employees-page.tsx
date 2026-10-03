"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProviderShell } from "./provider-shell";
import { TeamState, useEmployees } from "./provider-team-data";
import { dayNames, dayMinutes, hoursLabel, initials, normalized, services, weekMinutes } from "../lib/provider-client";

function EmployeeList() {
  const state = useEmployees();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelected(params.get("employee") ?? "");
    setNotice(params.get("saved") === "1" ? "Pracownik został zapisany." : params.get("deleted") === "1" ? "Pracownik został usunięty." : "");
  }, []);
  const employees = state.employees.filter(employee => normalized(`${employee.name} ${employee.email} ${employee.phone}`).includes(normalized(query.trim())));
  const employee = employees.find(employee => employee.id === selected) ?? employees[0];
  return <>
    {notice && <p className="provider-feedback" role="status">{notice}</p>}
    <div className="employees-content">
      <section className="employees-list-panel" aria-label="Lista pracowników">
        <div className="employees-list-toolbar"><label className="employee-search"><img src="/figma-assets/shared/search.svg" alt="" /><input aria-label="Szukaj pracownika" placeholder="Szukaj pracownika" value={query} onChange={event => setQuery(event.target.value)} /></label><Link href="/employees/add" className="employee-add-button">Dodaj<img src="/figma-assets/employees/plus.svg" alt="" /></Link></div>
        <TeamState {...state} />
        {!state.loading && !state.error && <div className="employee-rows">{employees.map(person => <button type="button" className={`employee-row${person.id === employee?.id ? " is-active" : ""}`} aria-pressed={person.id === employee?.id} key={person.id} onClick={() => { setSelected(person.id); window.history.replaceState(null, "", `/employees?employee=${person.id}`); }}><div><span className="employee-initials">{initials(person.name)}</span><span>{person.name}</span></div><img className="employee-chevron" src="/figma-assets/employees/chevron.svg" alt="" /></button>)}{!employees.length && <p>{state.employees.length ? "Brak pracowników pasujących do wyszukiwania." : "Nie masz jeszcze pracowników. Dodaj pierwszą osobę i ustaw jej godziny pracy."}</p>}</div>}
      </section>
      {!state.loading && !state.error && employee && <>
        <section className="employee-profile-card" aria-label={employee.name}>
          <div className="employee-profile-top"><span /><span className="employee-main-avatar employee-initials">{initials(employee.name)}</span><Link href={`/employees/edit?id=${employee.id}`} className="employee-edit" aria-label={`Edytuj pracownika — ${employee.name}`}><img src="/figma-assets/employees/pencil.svg" alt="" /></Link></div>
          <h1>{employee.name}</h1><div className="employee-contacts">{employee.phone && <a href={`tel:${employee.phone.replace(/[ ()-]/g, "")}`}>{employee.phone}</a>}{employee.email && <a href={`mailto:${employee.email}`}>{employee.email}</a>}{!employee.phone && !employee.email && <span>Nie podano danych kontaktowych</span>}</div>
          <strong className="employee-services-title">Realizowane usługi</strong><div className="employee-services">{employee.services.map(id => <article key={id} className={`employee-service ${id === "homes" ? "is-blue" : "is-brown"}`}><strong>Sprzątanie obiektów</strong><span>{services.find(service => service.id === id)?.label}</span></article>)}{!employee.services.length && <p>Nie przypisano usług.</p>}</div>
          <p>{employee.showInCalendar ? "Widoczny w grafiku pracy" : "Ukryty w grafiku pracy"}</p>
        </section>
        <section className="employee-schedule-card" aria-label="Grafik pracownika"><div className="employee-schedule-heading"><strong>Grafik pracownika</strong><Link href={`/work-schedules?employee=${employee.id}`}>Pokaż grafik</Link></div><div className="workdays">{employee.schedule.map(day => <div key={day.day} className={`workday-row${day.enabled ? "" : " is-disabled"}`}><span>{dayNames[day.day]}</span><div className="workday-hours">{day.enabled ? `${day.start} – ${day.end}` : "Dzień wolny"}</div><span>{hoursLabel(dayMinutes(day))}</span></div>)}</div><p className="weekly-hours">Łącznie w tygodniu: <strong>{hoursLabel(weekMinutes(employee))}</strong></p></section>
      </>}
    </div>
  </>;
}
export function ProviderEmployeesPage() { return <ProviderShell active="Pracownicy" figmaNode="5601:9221"><EmployeeList /></ProviderShell>; }
