import { ProviderShell } from "./provider-shell";

const servicesAsset = (name: string) => `/figma-assets/services/${name}`;

type Service = {
  category: string;
  detail: string;
  image: string;
  status: "published" | "draft";
};

const services: Service[] = [
  { category: "Sprzątanie obiektów", detail: "Mieszkań i domów", image: "cleaning.png", status: "published" },
  { category: "Sprzątanie obiektów", detail: "Biur i lokali użytkowych", image: "cleaning.png", status: "published" },
  { category: "Mycie ciśnieniowe", detail: "Kostki, chodników, tarasów", image: "pressure-washing.png", status: "draft" },
  { category: "Malowanie pow.", detail: "Ścian i sufitów", image: "painting.png", status: "draft" }
];

function AddServiceButton() {
  return <span className="add-service-button">Dodaj ogłoszenie<img src={servicesAsset("plus.svg")} alt="" /></span>;
}

function ServiceCard({ service }: { service: Service }) {
  const published = service.status === "published";

  return (
    <article className="service-card">
      <img className="service-image" src={servicesAsset(service.image)} alt="" />
      <div className="service-card-copy">
        <div className={`service-status is-${service.status}`}>
          <img src={servicesAsset(published ? "status-published.svg" : "status-draft.svg")} alt="" />
          <span>{published ? "Opublikowane" : "Szkic"}</span>
        </div>
        <div className="service-category">{service.category}</div>
        <div className="service-detail">{service.detail}</div>
      </div>
    </article>
  );
}

export function ProviderServicesPage() {
  return (
    <ProviderShell active="Twoje usługi" figmaNode="1676:2073">
      <section className="services-content" aria-labelledby="services-title">
        <img className="services-background" src={servicesAsset("background.png")} alt="" />
        <div className="services-heading">
          <h1 id="services-title">Twoje usługi</h1>
          <div><p>Konfiguruj, dodawaj i usuwaj usługi z jakimi chcesz się ogłaszać.</p><AddServiceButton /></div>
        </div>
        <div className="services-grid">
          {services.map(service => <ServiceCard service={service} key={`${service.category}-${service.detail}`} />)}
        </div>
      </section>
    </ProviderShell>
  );
}
