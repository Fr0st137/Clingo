import { ProviderShell } from "./provider-shell";

const clientsAsset = (name: string) => `/figma-assets/clients/${name}`;
const sharedAsset = (name: string) => `/figma-assets/shared/${name}`;

const clients = [
  { initials: "GT", name: "Paulina Jagielska", active: true },
  { initials: "AK", name: "Adrian Kaszubski" },
  { initials: "NZ", name: "Natalia Zawadzka" },
  { initials: "PW", name: "Paulina Witkowiak" },
  { initials: "TR", name: "Tymoteusz Rogódzki" },
  { initials: "MC", name: "Maliwina Cisielska" }
] as const;

const statistics = [
  ["Zamówienia", "2"],
  ["Nieobecności", "0"],
  ["Odwołane", "0"],
  ["Przychód z klienta", "527,40 zł"],
  ["Stały rabat", "5%"],
  ["Ostatnia wizyta", "14 maj 2025"]
] as const;

function RoundAction({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="client-round-action" aria-label={label}>
      <img src={icon} alt="" />
    </span>
  );
}

function ClientsList() {
  return (
    <section className="clients-list-panel" aria-label="Lista klientów">
      <div className="clients-list-toolbar">
        <div className="client-search"><img src={sharedAsset("search.svg")} alt="" /><span>Szukaj klienta</span></div>
        <span className="client-add-button">Dodaj<img src={clientsAsset("plus.svg")} alt="" /></span>
      </div>
      <div className="client-rows">
        {clients.map(client => (
          <article className={`client-row${"active" in client && client.active ? " is-active" : ""}`} key={client.name}>
            <div className="client-row-main"><span className="client-initials">{client.initials}</span><span>{client.name}</span></div>
            <img className="client-chevron" src={clientsAsset("chevron.svg")} alt="" />
          </article>
        ))}
      </div>
    </section>
  );
}

function ClientProfile() {
  return (
    <section className="client-profile-card" aria-label="Grażyna Tarnowska">
      <div className="client-profile-top">
        <div className="client-profile-side"><RoundAction icon={sharedAsset("pencil.svg")} label="Edytuj klienta" /></div>
        <div className="client-profile-avatar">GT</div>
        <div className="client-profile-side is-right">
          <RoundAction icon={clientsAsset("calendar-add.svg")} label="Dodaj termin" />
          <span className="clingo-client-badge">Klient z Clingo<span><img src={clientsAsset("clingo-favicon.png")} alt="" /></span></span>
        </div>
      </div>

      <h1>Grażyna Tarnowska</h1>

      <div className="client-contact-row">
        <RoundAction icon={sharedAsset("header-chat.svg")} label="Otwórz chat" />
        <span className="client-contact">+48 547 658 236</span>
        <span className="client-contact">paulina.jagielska@gmail.com</span>
      </div>

      <div className="client-statistics">
        {statistics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>

      <div className="client-section-heading"><strong>Informacje o kliencie</strong><span className="client-small-add">Dodaj<img src={clientsAsset("plus.svg")} alt="" /></span></div>

      <article className="client-note">
        <div><strong>Przyjaciel rodziny</strong><img src={clientsAsset("note-options.svg")} alt="Opcje" /></div>
        <p>Nie grzebać po szafkach i nie przestawiać rzeczy na pułkach. Jedynie przemyć i ścierać kurze. Parkiet w salonie myje się detergentem z pawlacza.</p>
      </article>
    </section>
  );
}

function ClientOrders() {
  return (
    <section className="client-orders-card" aria-label="Zlecenia klienta">
      <strong className="client-orders-title">Zlecenia klienta</strong>
      <div className="client-order-tabs"><span className="is-active">Nadchodzące (0)</span><span>Zakończone (2)</span></div>
      <div className="client-orders-empty">
        <img src={clientsAsset("empty-orders.png")} alt="" />
        <strong>Brak nadchodzących zamówień</strong>
      </div>
    </section>
  );
}

export function ProviderClientsPage() {
  return (
    <ProviderShell active="Klienci" figmaNode="4033:7735">
      <div className="clients-content"><ClientsList /><ClientProfile /><ClientOrders /></div>
    </ProviderShell>
  );
}
