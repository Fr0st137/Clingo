import { ProviderSettingsLayout } from "./provider-settings-layout";
import { SettingsButton, SettingsField, SettingsSection, settingsAsset } from "./provider-settings-fields";

export function ProviderSettingsDataPage() {
  return (
    <ProviderSettingsLayout active="Twoje dane" figmaNode="1957:1857">
      <SettingsSection title="Link do Twojego profilu Clingo" description="Udostępniaj swój profil, aby klienci mogli rezerwować Twoje usługi.">
        <SettingsField label="Wyświetlana nazwa firmy/działalności" value="https://clingo.pl/@PaulinaJagielska" action="Skopiuj" />
      </SettingsSection>
      <SettingsSection title="Wyświetlana nazwa firmy/działalności" description="Jest to nazwa, która wyświetla się klientom, może być ona np. samym imieniem i nazwiskiem lub skróconą nazwą firmy.">
        <SettingsField label="Wyświetlana nazwa firmy/działalności" value="Paulina Jagielska" action="Edytuj" />
      </SettingsSection>
      <SettingsSection title="Pełna nazwa firmy/działalności" description="Zmieniona nazwa będzie automatycznie wyświetlać się także na nowych fakturach.">
        <SettingsField label="Nazwa firmy/działalności" value="Paulina Jagielska Sprzątanie" action="Edytuj" />
      </SettingsSection>
      <SettingsSection title="Adres e-mail" description="Potwierdź lub edytuj. Edycja będzie wiązała się zmianą adresu e-mail do logowania, informacji i zamówień.">
        <SettingsField label="Adres e-mail" value="paulina.jagielska@gmail.com" action="Edytuj" verified compact />
        <SettingsButton disabled>Potwierdź</SettingsButton>
      </SettingsSection>
      <SettingsSection title="Numer telefonu" description="Potwierdź lub edytuj. Edycja będzie wiązała się zmianą numeru telefonu w zakresie informacji i zamówień." className="settings-phone-section">
        <SettingsField label="Numer telefonu" value="+48 547 658 236" action="Edytuj" verified compact />
        <SettingsButton disabled>Potwierdź</SettingsButton>
      </SettingsSection>
      <SettingsSection title="Hasło" description="Edycja będzie wiązała się zmianą hasła do logowania się na konto Wykonawcy Clingo.">
        <SettingsField label="Dotychczasowe hasło" password compact />
        <SettingsField label="Nowe hasło" password compact />
        <SettingsField label="potwierdź hasło" password compact />
        <SettingsButton>Zmień hasło</SettingsButton>
      </SettingsSection>
      <SettingsSection title="Dane osoby kontaktowej" description="Dane osoby kontaktowej wykorzystywane są w wyjątkowych przypadkach do kontaktu Clingo z Wykonawcą.">
        <SettingsField label="Imię i nazwisko" value="Paulina Jagielska" action="Edytuj" />
        <SettingsField label="Numer telefonu" value="+48 547 658 236" action="Edytuj" />
        <SettingsField label="Adres e-mail" value="paulina.jagielska@gmail.com" action="Edytuj" />
      </SettingsSection>
      <SettingsSection title="Usuń konto" description="Aby usunąć konto nie możesz mieć żadnego zamówienia do realizacji. Zablokuj przyszłe terminy, a zamówienia do realizacji wykonaj lub odwołaj.">
        <div className="settings-delete-account">
          <SettingsButton className="settings-delete-button">Usuń konto<img src={settingsAsset("trash.svg")} alt="" /></SettingsButton>
          <p>Usunięcie konta jest nieodwracalne i równoznaczne z usunięciem wszystkich danych dotyczących Twojej osoby i firmy z serwisu Clingo.pl</p>
        </div>
        <button type="button" className="settings-download-data">Pobierz kopię swoich danych z Clingo<img src={settingsAsset("download.svg")} alt="" /></button>
      </SettingsSection>
    </ProviderSettingsLayout>
  );
}
