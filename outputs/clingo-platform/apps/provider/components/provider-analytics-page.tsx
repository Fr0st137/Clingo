import { ProviderShell } from "./provider-shell";

const analyticsAsset = (name: string) => `/figma-assets/analytics/${name}`;

const kpis = [
  ["Wartość wykonanych zamówień", "9 842,50 zł", "+12,4% vs poprzedni okres"],
  ["Wykonane zamówienia", "43", "+8,0% vs poprzedni okres"],
  ["Średnia wartość zamówienia", "228,90 zł", "+4,1% vs poprzedni okres"],
  ["Wykorzystanie grafiku", "72%", "+6 p.p. vs poprzedni okres"],
  ["Klienci powracający", "64%", "+9 p.p. vs poprzedni okres"],
  ["Anulowane zamówienia", "8,2%", "−2,1 p.p. vs poprzedni okres"]
] as const;

const heatmap = [
  ["Pon", 2, 3, 3, 2, 1, 1, 0],
  ["Wt", 1, 1, 1, 0, 0, 0, 0],
  ["Śr", 1, 2, 2, 1, 1, 0, 0],
  ["Czw", 3, 3, 2, 3, 2, 1, 0],
  ["Pt", 2, 2, 1, 1, 1, 0, 0],
  ["Sob", 3, 3, 3, 2, 1, 1, 0],
  ["Nd", 0, 0, 0, 0, 0, 0, 0]
] as const;

function AnalyticsFilter({ children }: { children: string }) {
  return <span className="analytics-filter">{children}<img src={analyticsAsset("angle.svg")} alt="" /></span>;
}

function AnalyticsHeader() {
  return (
    <div className="analytics-page-header">
      <div className="analytics-title"><h1>Analizy i podsumowania</h1><p>Sprawdź wyniki swojej działalności i zobacz, co możesz poprawić.</p></div>
      <div className="analytics-filters">
        <AnalyticsFilter>Ostatnie 30 dni</AnalyticsFilter>
        <AnalyticsFilter>vs poprzednie 30 dni</AnalyticsFilter>
        <AnalyticsFilter>Wszystkie usługi</AnalyticsFilter>
        <AnalyticsFilter>Wszyscy pracownicy</AnalyticsFilter>
      </div>
    </div>
  );
}

function KpiRow() {
  return (
    <div className="analytics-kpis">
      {kpis.map(([label, value, change]) => (
        <article className="analytics-kpi" key={label}><span>{label}</span><strong>{value}</strong><small>{change}</small></article>
      ))}
    </div>
  );
}

function ResultsChart() {
  const yLabels = ["3 000 zł", "2 500 zł", "2 000 zł", "1 500 zł"];
  const xLabels = ["1–7 czerwca", "8–14 czerwca", "15–21 czerwca", "22–30 czerwca"];

  return (
    <article className="analytics-card results-card">
      <div className="results-header">
        <h2>Wyniki w czasie</h2>
        <div className="metric-switcher"><span className="is-active">Wartość zamówień</span><span>Zamówienia</span><span>Godziny pracy</span></div>
      </div>
      <div className="results-chart" aria-label="Wykres wartości zamówień w czerwcu">
        <img className="chart-grid" src={analyticsAsset("chart-grid.svg")} alt="" />
        <img className="chart-area" src={analyticsAsset("chart-area.svg")} alt="" />
        <img className="chart-comparison" src={analyticsAsset("chart-comparison.svg")} alt="" />
        <img className="chart-line" src={analyticsAsset("chart-line.svg")} alt="" />
        <img className="chart-point" src={analyticsAsset("chart-point.svg")} alt="" />
        <div className="chart-y-labels">{yLabels.map(label => <span key={label}>{label}</span>)}</div>
        <div className="chart-x-labels">{xLabels.map(label => <span key={label}>{label}</span>)}</div>
      </div>
    </article>
  );
}

function InsightsCard() {
  const insights = [
    "Wartość zamówień wzrosła o 12,4%, głównie dzięki usługom dodatkowym.",
    "Najwięcej wolnych terminów masz we wtorki między 14:00 a 18:00.",
    "Liczba anulowanych zamówień spadła o 2,1 p.p."
  ];

  return (
    <article className="analytics-card insights-card">
      <h2>Najważniejsze wnioski</h2>
      {insights.map(insight => <p key={insight}>{insight} <span>Zobacz szczegóły →</span></p>)}
    </article>
  );
}

function HeatmapCard() {
  const slots = ["8–10", "10–12", "12–14", "14–16", "16–18", "18–20", "20–22"];

  return (
    <article className="analytics-card heatmap-card">
      <div className="heatmap-header">
        <div><h2>Wykorzystanie grafiku</h2><p>Udział zarezerwowanych godzin w dostępnych godzinach pracy.</p></div>
        <span>Średnie wykorzystanie: 72%</span>
      </div>
      <div className="heatmap">
        <div className="heatmap-time"><i />{slots.map(slot => <span key={slot}>{slot}</span>)}</div>
        {heatmap.map(([day, ...levels]) => (
          <div className="heatmap-row" key={day}><span>{day}</span>{levels.map((level, index) => <i className={`level-${level}`} key={`${day}-${index}`} />)}</div>
        ))}
        <div className="heatmap-legend"><span>mniejsze</span><i className="level-0" /><i className="level-1" /><i className="level-3" /><span>większe</span></div>
      </div>
    </article>
  );
}

function OrderStatusCard() {
  const statuses = [
    ["donut-dot-1.svg", "Wykonane", "43"],
    ["donut-dot-2.svg", "Odwołane", "4"],
    ["donut-dot-3.svg", "Przełożone", "2"]
  ];

  return (
    <article className="analytics-card order-status-card">
      <h2>Status zamówień</h2>
      <div className="status-visual">
        <div className="status-donut">
          <img className="status-donut-export" src={analyticsAsset("order-status-donut.png")} alt="49 zamówień" />
        </div>
        <div className="status-legend">{statuses.map(([dot, label, value]) => <div key={label}><img src={analyticsAsset(dot)} alt="" /><span>{label}</span><strong>{value}</strong></div>)}</div>
      </div>
      <p className="cancellation-note">Szacowana utracona wartość anulowań: 780 zł</p>
    </article>
  );
}

function TopServicesCard() {
  const services = [
    ["Sprzątanie mieszkań i domów", "31", "6 528,00 zł", "142 h", "45,97 zł/h", "+14%"],
    ["Sprzątanie biur i lokali użytkowych", "12", "3 314,50 zł", "84 h", "39,46 zł/h", "+9%"]
  ];
  const addOns = [["Mycie okien", "17 zamówień"], ["Mycie piekarnika", "12 zamówień"], ["Czyszczenie lodówki", "7 zamówień"]];

  return (
    <article className="analytics-card top-services-card">
      <h2>Najskuteczniejsze usługi</h2>
      <div className="analytics-services-content">
        <div className="services-table">
          <div className="service-table-row is-header"><span>Usługa</span><span>Zamówienia</span><span>Wartość</span><span>Godziny</span><span>Wartość / godz.</span><span>Zmiana</span></div>
          {services.map((service, index) => <div className={`service-table-row${index ? " is-shaded" : ""}`} key={service[0]}>{service.map((cell, cellIndex) => <span className={cellIndex === 5 ? "is-positive" : ""} key={cell}>{cell}</span>)}</div>)}
        </div>
        <div className="popular-addons"><h3>Najpopularniejsze usługi dodatkowe</h3>{addOns.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </div>
    </article>
  );
}

function ClientsCard() {
  const clientKpis = [
    ["Nowi klienci", "10", "+25% vs poprzedni okres"],
    ["Powracający", "18", "+12,5% vs poprzedni okres"],
    ["Ponowna rezerwacja", "11", "39% aktywnych klientów"]
  ];

  return (
    <article className="analytics-card clients-card">
      <div className="clients-header"><div><h2>Klienci</h2><p>Jakość i dynamika bazy klientów</p></div><span>28 aktywnych</span></div>
      <div className="client-kpis">{clientKpis.map(([label, value, context], index) => <div key={label}><span>{label}</span><strong>{value}</strong><small className={index === 2 ? "is-blue" : ""}>{context}</small></div>)}</div>
      <div className="client-structure">
        <strong>Struktura aktywnych klientów</strong>
        <div className="client-bar"><i /><b /></div>
        <div className="client-legend"><span><img src={analyticsAsset("client-new.svg")} alt="" />Nowi 36%</span><span><img src={analyticsAsset("client-returning.svg")} alt="" />Powracający 64%</span></div>
        <p><b>Wniosek:</b> 18 z 28 aktywnych klientów wróciło w tym okresie.</p>
      </div>
    </article>
  );
}

function EmployeesResultsCard() {
  const employees = [
    { initials: "PJ", name: "Paulina Jagielska", status: "Najlepszy wynik w zespole", value: "6 120,00 zł", change: "↑ 15,8% vs poprzedni okres", use: 78, orders: 27, hours: 143, rating: "4,8", reviews: "3 opinie" },
    { initials: "BK", name: "Beata Kaszwabendzka", status: "2. wynik w zespole", value: "3 722,50 zł", change: "↑ 7,2% vs poprzedni okres", use: 65, orders: 16, hours: 83, rating: "4,6", reviews: "2 opinie" }
  ];

  return (
    <article className="analytics-card employee-results-card">
      <div className="employee-results-header"><div><h2>Wyniki pracowników</h2><p>Porównanie efektywności zespołu w wybranym okresie</p></div><span>2 pracowników</span></div>
      <div className="employee-ranking">
        <div className="employee-rank-row rank-head"><span>Pracownik</span><span>Wartość zamówień</span><span>Wykorzystanie</span><span>Zamówienia</span><span>Godziny</span><span>Ocena</span></div>
        {employees.map((employee, index) => (
          <div className={`employee-rank-row rank-entry${index ? " is-second" : ""}`} key={employee.name}>
            <div className="rank-person"><i>{employee.initials}</i><span><strong>{employee.name}</strong><small>{employee.status}</small></span></div>
            <div><strong>{employee.value}</strong><small className="positive">{employee.change}</small></div>
            <div><strong>{employee.use}%</strong><span className="utilization"><i style={{ width: `${employee.use}%` }} /></span></div>
            <div><strong>{employee.orders}</strong><small>wykonane</small></div>
            <div><strong>{employee.hours} h</strong><small>pracy</small></div>
            <div><strong><i className="rating-star">★</i> {employee.rating}</strong><small>{employee.reviews}</small></div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function ProviderAnalyticsPage() {
  return (
    <ProviderShell active="Analizy i podsumowania" figmaNode="6771:12214">
      <section className="analytics-content">
        <div className="analytics-dashboard">
          <AnalyticsHeader />
          <KpiRow />
          <div className="analytics-wide-row"><ResultsChart /><InsightsCard /></div>
          <div className="analytics-wide-row"><HeatmapCard /><OrderStatusCard /></div>
          <TopServicesCard />
          <div className="analytics-bottom-row"><ClientsCard /><EmployeesResultsCard /></div>
        </div>
      </section>
    </ProviderShell>
  );
}
