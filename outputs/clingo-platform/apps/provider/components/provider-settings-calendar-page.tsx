import { ProviderSettingsLayout } from "./provider-settings-layout";
import { settingsAsset } from "./provider-settings-fields";

const serviceTypes = [
  { label: "Mieszkań i domów", color: "blue" },
  { label: "Biur i lokali użytkowych", color: "brown" }
] as const;

function CalendarServiceColor({ label, color, muted }: { label: string; color: string; muted: boolean }) {
  return (
    <button type="button" className={`settings-calendar-color${muted ? " is-muted" : ""}`} disabled>
      <span>{label}</span>
      <img src={settingsAsset(`calendar/color-${color}${muted ? "-muted" : ""}.svg`)} alt={color === "blue" ? "Kolor niebieski" : "Kolor brązowy"} />
    </button>
  );
}

function CalendarServiceColors({ title, icon, locked = false }: { title: string; icon: string; locked?: boolean }) {
  return (
    <section className={`settings-calendar-service${locked ? " is-locked" : ""}`} aria-label={title}>
      <div className="settings-calendar-service-heading">
        <div><img src={settingsAsset(`calendar/${icon}`)} alt="" /><h3>{title}</h3></div>
        {locked ? <img className="settings-calendar-lock" src={settingsAsset("calendar/lock.svg")} alt="Zablokowane" /> : null}
      </div>
      <div className="settings-calendar-color-columns">
        {[false, !locked].map((muted, columnIndex) => (
          <div className="settings-calendar-color-column" key={columnIndex}>
            {serviceTypes.map(service => <CalendarServiceColor label={service.label} color={service.color} muted={muted} key={service.label} />)}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProviderSettingsCalendarPage() {
  return (
    <ProviderSettingsLayout active="Kalendarz" figmaNode="6011:11694">
      <div className="settings-calendar-default">
        <h1>Ustawienia kalendarza</h1>
        <h2>Domyślny widok kalendarza</h2>
        <button type="button" className="settings-calendar-view" aria-label="Domyślny widok kalendarza: Dzień" disabled><span>Dzień</span><img src={settingsAsset("calendar/angle.svg")} alt="" /></button>
      </div>
      <div className="settings-calendar-services">
        <h2>Wybierz kolor rodzaju usług w kalendarzu</h2>
        <CalendarServiceColors title="Sprzątanie obiektów" icon="cleaning.png" />
        <CalendarServiceColors title="Mycie ciśnieniowe" icon="pressure-washing.png" locked />
        <CalendarServiceColors title="Malowanie powierzchni" icon="painting.png" locked />
        <CalendarServiceColors title="Mycie ciśnieniowe" icon="pressure-washing.png" locked />
      </div>
    </ProviderSettingsLayout>
  );
}
