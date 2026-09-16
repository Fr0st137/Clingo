import Link from "next/link";

const asset = (name: string) => `/figma-assets/calendar/${name}`;

export function ProviderCalendarToolbar({ view }: { view: "month" | "week" }) {
  return (
    <div className={`calendar-toolbar${view === "week" ? " is-week" : ""}`}>
      <nav className="view-switcher" aria-label="Widok kalendarza">
        <Link href="/" className={view === "month" ? "is-active" : ""} aria-current={view === "month" ? "page" : undefined}>Miesiąc</Link>
        <Link href="/calendar/week" className={view === "week" ? "is-active" : ""} aria-current={view === "week" ? "page" : undefined}>Tydzień</Link>
        <span>Dzień</span>
      </nav>
      <div className="month-switcher">
        <span className="month-arrow is-previous"><img src={asset("angle.svg")} alt="" /></span>
        <strong>{view === "week" ? "Październik 7 - 13" : "Październik 2026"}</strong>
        <span className="month-arrow is-next"><img src={asset("angle.svg")} alt="" /></span>
      </div>
      <div className="calendar-tools">
        <span className="service-filter">Wszystkie rodzaje usług<img src={asset("dropdown.svg")} alt="" /></span>
        <span className="add-event">Dodaj zdarzenie<i aria-hidden="true" /></span>
        <img className="options-icon" src={asset("options.svg")} alt="Opcje" />
      </div>
    </div>
  );
}
