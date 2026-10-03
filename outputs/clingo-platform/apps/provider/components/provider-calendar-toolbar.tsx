import type { CalendarView } from "../lib/provider-jobs";

const asset = (name: string) => `/figma-assets/calendar/${name}`;

export function ProviderCalendarToolbar({
  view,
  periodLabel,
  services,
  service,
  onViewChange,
  onPrevious,
  onNext,
  onServiceChange,
  onAdd,
  onRefresh
}: {
  view: CalendarView;
  periodLabel: string;
  services: string[];
  service: string;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onServiceChange: (service: string) => void;
  onAdd: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className={`calendar-toolbar${view === "week" ? " is-week" : view === "day" ? " is-day" : ""}`}>
      <nav className="view-switcher" aria-label="Widok kalendarza">
        {(["month", "week", "day"] as const).map(value => (
          <button type="button" className={view === value ? "is-active" : ""} aria-pressed={view === value} onClick={() => onViewChange(value)} key={value}>
            {value === "month" ? "Miesiąc" : value === "week" ? "Tydzień" : "Dzień"}
          </button>
        ))}
      </nav>
      <div className="month-switcher">
        <button type="button" className="month-arrow is-previous" aria-label="Poprzedni okres" onClick={onPrevious}><img src={asset("angle.svg")} alt="" /></button>
        <strong>{periodLabel}</strong>
        <button type="button" className="month-arrow is-next" aria-label="Następny okres" onClick={onNext}><img src={asset("angle.svg")} alt="" /></button>
      </div>
      <div className="calendar-tools">
        <label className="service-filter">
          <span className="sr-only">Rodzaj usługi</span>
          <select value={service} onChange={event => onServiceChange(event.target.value)} aria-label="Rodzaj usługi">
            <option value="">Wszystkie rodzaje usług</option>
            {services.map(title => <option value={title} key={title}>{title}</option>)}
          </select>
          <img src={asset("dropdown.svg")} alt="" />
        </label>
        <button type="button" className="add-event" onClick={onAdd}>Dodaj zdarzenie<i aria-hidden="true" /></button>
        <button type="button" className="calendar-options" aria-label="Odśwież kalendarz" onClick={onRefresh}><img className="options-icon" src={asset("options.svg")} alt="" /></button>
      </div>
    </div>
  );
}
