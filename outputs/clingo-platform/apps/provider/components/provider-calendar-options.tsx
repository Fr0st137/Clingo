"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { CalendarView } from "../lib/provider-jobs";

const asset = (name: string) => `/figma-assets/calendar/options/${name}`;
export type CalendarColors = Partial<Record<"homes" | "offices", string>>;

export function ProviderCalendarOptions({ id, trigger, defaultView, colors, onDefaultView, onColor, onClose }: {
  id: string; trigger: RefObject<HTMLButtonElement | null>; defaultView: CalendarView; colors: CalendarColors;
  onDefaultView: (view: CalendarView) => void; onColor: (category: "homes" | "offices", color: string) => void; onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties>({ visibility: "hidden" });
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    function place() {
      const box = trigger.current?.getBoundingClientRect();
      if (!box) return;
      const width = Math.min(390, window.innerWidth - 32);
      const below = box.bottom + 10;
      const top = window.innerHeight - below - 16 >= 450 ? below : Math.max(16, window.innerHeight - 775 - 16);
      setPosition({ left: Math.max(16, Math.min(box.right - width, window.innerWidth - width - 16)), top, width, maxHeight: window.innerHeight - top - 16 });
    }
    place(); el.showPopover();
    el.querySelector<HTMLSelectElement>("select")?.focus({ preventScroll: true });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [trigger]);
  return <div className="calendar-settings-popover" id={id} ref={panel} popover="auto" role="dialog" aria-labelledby={`${id}-title`} style={position}
    onToggle={event => { if (event.newState === "closed") onClose(); }}
    onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); panel.current?.hidePopover(); trigger.current?.focus(); } }}>
    <div className="calendar-options-default">
      <h2 id={`${id}-title`}>Ustawienia kalendarza</h2>
      <label htmlFor={`${id}-view`}>Domyślny widok kalendarza</label>
      <div className="calendar-options-view"><select id={`${id}-view`} value={defaultView} onChange={event => onDefaultView(event.target.value as CalendarView)}><option value="day">Dzień</option><option value="week">Tydzień</option><option value="month">Miesiąc</option></select><img src={asset("dropdown.svg")} alt="" /></div>
    </div>
    <div className="calendar-options-colors">
      <h3>Wybierz kolor rodzaju usług w kalendarzu</h3>
      <section className="settings-calendar-service" aria-label="Sprzątanie obiektów">
        <div className="settings-calendar-service-heading"><div><img src={asset("cleaning.png")} alt="" /><h3>Sprzątanie obiektów</h3></div></div>
        <div className="settings-calendar-color-column">
          {([{ category: "homes", label: "Mieszkań i domów", fallback: "#b9ddff" }, { category: "offices", label: "Biur i lokali użytkowych", fallback: "#dfae88" }] as const).map(({ category, label, fallback }) => <label className="settings-calendar-color calendar-options-color" key={category}>
            <span>{label}</span><span className="calendar-options-swatch">{colors[category] ? <span className="calendar-options-custom-swatch" style={{ background: `linear-gradient(135deg, ${colors[category]} 50%, color-mix(in srgb, ${colors[category]} 40%, white) 50%)` }} /> : <img src={asset(`${category}.svg`)} alt="" />}<input type="color" aria-label={`Kolor: ${label}`} value={colors[category] ?? fallback} onChange={event => onColor(category, event.target.value)} /></span>
          </label>)}
        </div>
        <button type="button" className="settings-calendar-color is-muted calendar-options-renovation" disabled><span>Po remoncie (Mieszkań i domów)</span><img src={asset("renovation-muted.svg")} alt="" /></button>
      </section>
    </div>
  </div>;
}
