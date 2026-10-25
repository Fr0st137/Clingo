import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { CalendarView } from "../lib/provider-jobs";
import { ProviderCalendarOptions, type CalendarColors } from "./provider-calendar-options";

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
  onAbsence,
  defaultView,
  colors,
  onDefaultView,
  onColor
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
  onAbsence: () => void;
  defaultView: CalendarView;
  colors: CalendarColors;
  onDefaultView: (view: CalendarView) => void;
  onColor: (category: "homes" | "offices", color: string) => void;
}) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuId = useId();
  const addMenuRoot = useRef<HTMLDivElement>(null);
  const addMenuButton = useRef<HTMLButtonElement>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsButton = useRef<HTMLButtonElement>(null);
  const optionsId = useId();
  useEffect(() => {
    if (!addMenuOpen) return;
    addMenuRoot.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !addMenuRoot.current?.contains(event.target)) setAddMenuOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [addMenuOpen]);
  function menuKeys(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault(); event.stopPropagation(); setAddMenuOpen(false); addMenuButton.current?.focus();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const items = Array.from(addMenuRoot.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);
      if (!items.length) return;
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length]?.focus();
    }
  }
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
        <div className="calendar-add-event" ref={addMenuRoot} onKeyDown={menuKeys} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAddMenuOpen(false); }}>
          <button type="button" className={`add-event${addMenuOpen ? " is-open" : ""}`} ref={addMenuButton} aria-haspopup="menu" aria-expanded={addMenuOpen} aria-controls={addMenuOpen ? addMenuId : undefined} onClick={() => { setOptionsOpen(false); setAddMenuOpen(open => !open); }} onKeyDown={event => { if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !addMenuOpen) { event.preventDefault(); setAddMenuOpen(true); } }}>Dodaj zdarzenie<i aria-hidden="true" /></button>
          {addMenuOpen && <div className="calendar-add-event-menu" id={addMenuId} role="menu" aria-label="Dodaj zdarzenie">
            <button type="button" role="menuitem" onClick={() => { setAddMenuOpen(false); addMenuButton.current?.focus(); onAdd(); }}>Dodaj zamówienie</button>
            <button type="button" role="menuitem" onClick={() => { setAddMenuOpen(false); addMenuButton.current?.focus(); onAbsence(); }}>Nieobecność (urlop, choroba)</button>
          </div>}
        </div>
        <button type="button" className={`calendar-options${optionsOpen ? " is-open" : ""}`} ref={optionsButton} aria-label="Ustawienia kalendarza" aria-haspopup="dialog" aria-expanded={optionsOpen} aria-controls={optionsOpen ? optionsId : undefined} onClick={() => { setAddMenuOpen(false); setOptionsOpen(open => !open); }}><img className="options-icon" src={asset("options.svg")} alt="" /></button>
        {optionsOpen && <ProviderCalendarOptions id={optionsId} trigger={optionsButton} defaultView={defaultView} colors={colors} onDefaultView={onDefaultView} onColor={onColor} onClose={() => setOptionsOpen(false)} />}
      </div>
    </div>
  );
}
