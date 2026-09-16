import { ProviderShell } from "./provider-shell";

const scheduleAsset = (name: string) => `/figma-assets/work-schedules/${name}`;
const employeeAsset = (name: string) => `/figma-assets/employees/${name}`;

const employees = [
  { name: "Paulina Jagielska", avatar: "paulina.png", day: "10h/12h", week: "60h/72h", month: "240h/288h" },
  { name: "Beata Kaszwabendzka", avatar: "beata.png", day: "10h/12h", week: "60h/72h", month: "240h/288h" }
] as const;

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

function ScheduleToolbar() {
  return (
    <div className="schedule-toolbar">
      <div className="schedule-view-switcher"><span className="is-active">Dzień</span><span>Tydzień</span></div>
      <div className="schedule-date-switcher">
        <span className="schedule-date-arrow is-previous"><img src={scheduleAsset("angle.svg")} alt="Poprzedni dzień" /></span>
        <div><strong>Sb, 13 Paź</strong><span>8:00 - 20:00</span></div>
        <span className="schedule-date-arrow is-next"><img src={scheduleAsset("angle.svg")} alt="Następny dzień" /></span>
      </div>
      <div className="schedule-actions">
        <span><img src={scheduleAsset("copy.svg")} alt="" />Skopiuj na inne dni</span>
        <span><img src={scheduleAsset("download.svg")} alt="" />Pobierz</span>
        <span className="schedule-absence">Nieobecność<img src={scheduleAsset("plus.svg")} alt="" /></span>
      </div>
    </div>
  );
}

function EmployeeScheduleRow({ employee }: { employee: typeof employees[number] }) {
  return (
    <article className="schedule-employee-row">
      <div className="schedule-employee-person"><img src={employeeAsset(employee.avatar)} alt="" /><span>{employee.name}</span></div>
      <div className="schedule-employee-summary">
        <span>Dzień: {employee.day}</span><span>Tydzień: {employee.week}</span><span>Miesiąc: {employee.month}</span>
      </div>
      <img className="schedule-employee-edit" src={scheduleAsset("pencil.svg")} alt="Edytuj grafik" />
    </article>
  );
}

function TimelineGrid() {
  return (
    <div className="timeline-grid" aria-label="Grafik na sobotę 13 października">
      <div className="shift-bar is-first"><span>08:00 - 18:00</span><img src={scheduleAsset("pencil.svg")} alt="Edytuj zmianę" /></div>
      <div className="shift-bar is-second"><span>10:00 - 20:00</span><img src={scheduleAsset("pencil.svg")} alt="Edytuj zmianę" /></div>
    </div>
  );
}

export function ProviderWorkSchedulesPage() {
  return (
    <ProviderShell active="Grafiki pracy" figmaNode="5754:9661">
      <section className="work-schedules-content">
        <ScheduleToolbar />
        <div className="timeline-hours">{hours.map(hour => <span key={hour}>{hour}</span>)}</div>
        <div className="schedule-board">
          <div className="schedule-employees">{employees.map(employee => <EmployeeScheduleRow employee={employee} key={employee.name} />)}</div>
          <TimelineGrid />
        </div>
      </section>
    </ProviderShell>
  );
}
