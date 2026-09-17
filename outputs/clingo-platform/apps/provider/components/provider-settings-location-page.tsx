import { SettingsField, SettingsSection, settingsAsset } from "./provider-settings-fields";
import { ProviderSettingsLayout } from "./provider-settings-layout";

function ServiceAreaRange() {
  return (
    <div className="settings-service-range" role="img" aria-label="Zasięg oferowania usług: 52 km, skala od 0 do 100 km">
      <div className="settings-service-range-value">
        <strong>52 km</strong>
        <div className="settings-service-range-track">
          <div className="settings-service-range-fill" />
          <img src={settingsAsset("location/range-thumb.svg")} alt="" />
        </div>
      </div>
      <div className="settings-service-range-labels">
        {Array.from({ length: 11 }, (_, index) => <span key={index}>{index * 10} km</span>)}
      </div>
    </div>
  );
}

export function ProviderSettingsLocationPage() {
  return (
    <ProviderSettingsLayout active="Lokalizacja i zasięg" figmaNode="1984:2519" fitContent>
      <SettingsSection title="Lokalizacja" description="Podaj adres, który stanowić będzie Twoją wyjściową lokalizację, od której liczony będzie zasięg oferowania usług oraz dojazd do klienta.">
        <SettingsField label="Adres lokalizacji" value="Stępińska 5, 00-739 Warszawa" action="Edytuj" compact />
      </SettingsSection>
      <SettingsSection title="Zasięg oferowania usług" description="Jest to promień, w którym klienci po wpisaniu swojego adresu będą mogli zobaczyć Twoje ogłoszenie." className="settings-service-area-section">
        <img className="settings-service-area-map" src={settingsAsset("location/service-area-map.png")} alt="Mapa okolic Warszawy z zaznaczoną lokalizacją i obszarem oferowania usług" />
        <ServiceAreaRange />
      </SettingsSection>
    </ProviderSettingsLayout>
  );
}
