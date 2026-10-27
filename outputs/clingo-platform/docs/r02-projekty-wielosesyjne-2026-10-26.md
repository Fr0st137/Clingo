# R02 — pełny metraż i projekty wielosesyjne

Poprawka dotyczy R02 z raportu zgodności z zakresem oraz bezpośrednich przeszkód w złożeniu takiego zamówienia.

## Działanie po zmianie

- Publikacja zachowuje skonfigurowany maksymalny metraż, również gdy już minimalny wariant wymaga kilku dni. Usunięto obcięcie oferty do jednej wizyty.
- Tryb zależy od wybranego metrażu, wydajności, obsady z widełek R01, dodatków wydłużających pracę i długości dnia roboczego. Katalog, oferta, podsumowanie i serwer korzystają z tych samych zasad. Pojedyncza sesja trwa maksymalnie 12 godzin.
- Przykład: 500 m² × 180 minut / 100 m² / 1 osoba = 900 minut. Przy pustym kalendarzu i starcie o 08:00 powstają sesje 12 h i 3 h. Pełna cena przy stawce 1,50 zł/m² wynosi 750 zł.
- Harmonogram wykorzystuje wolne okna firmy, w tym odcinki przed i po innym zleceniu, zachowując bufory oraz dni i godziny dostępności klienta. Cały wymagany czas musi się zmieścić; nie zapisujemy niepełnego planu.
- Zachowano horyzont sześciu miesięcy oraz maksymalnie dwa pełne dni przerwy między sesjami. Limit liczby sesji wynosi 186; brak możliwości ułożenia pełnego planu daje komunikat i wymaga zmiany terminu/dostępności.
- „Zmień dzień” wyłącza datę i przelicza cały plan od początku. Wyłączenia, dostępność i sesje przechodzą do podsumowania i przetrwają odświeżenie strony.
- Klient może również wybrać planowanie w kilku sesjach dla krótszej usługi, gdy nie znajduje jednego odpowiednio długiego wolnego okna.
- Projekty są wyceniane jako jednorazowa realizacja, bez rabatu za deklarację cotygodniowego sprzątania. Nie dodano płatności online za usługę.
- Zapis ponownie sprawdza każdą sesję, łączny czas, bufory, dostępność, przerwy i aktualne kolizje. Liczbę osób wylicza serwer. Wykonawca otrzymuje wszystkie sesje jednej rezerwacji z zachowaniem całej ceny i czasu.
- Dodano brakujące pola danych kontaktowych w podsumowaniu projektu, umożliwiając zamówienie nowemu klientowi. Poprawiono ograniczenie szerokości harmonogramu na telefonie.

## Dane i środowisko

Zastosowano lokalnie migracje `20261026-offer-staffing-estimate.sql` (R01) oraz `20261026-multi-session-publication.sql` (R02). Przed zmianą zachowano kopię kwalifikujących się konfiguracji. Nie było istniejących publicznych profili wymagających aktualizacji; migracje dodatkowo sprawdzono dwukrotnie na własnej tymczasowej ofercie. Istniejące zamówienia zachowują dotychczasowe terminy, ceny i parametry.

Po zgodzie użytkownika przywrócono Docker przez odsunięcie katalogów zawierających wyłącznie puste, zablokowane gniazda. Nie resetowano wolumenów bazy. Migracje należy osobno zastosować na każdym innym środowisku, także przy włączonej synchronizacji schematu.

## Weryfikacja

- Testy rezerwacji, R01/R02 i parametrów oferty: 31/31 zaliczone (`tmp/r02-tests.log`).
- Podstawowe moduły wykonawcy: 52/52 zaliczone (`tmp/r02-provider-tests.log`). Razem 83 testy.
- Produkcyjne kompilacje API, panelu wykonawcy i strony klienta: zaliczone.
- Rzeczywiste API i PostgreSQL: `scripts/verify-publication.cjs` — zaliczony. Publikacja, migracje, czas/obsada, zachowanie dawnych parametrów, rezerwacja wielosesyjna, wszystkie sesje u wykonawcy i suma ceny.
- Przeglądarka z rzeczywistą bazą: `scripts/verify-multi-session-booking.cjs` — zaliczony. Zmiana 100 → 500 m² zmienia tryb, wygenerowano 900 minut pracy, wyłączenie daty przelicza całość, odświeżenie zachowuje plan, nowy klient uzupełnia kontakt i składa zamówienie, wykonawca widzi 2 sesje o sumie 750 zł. Sprawdzono szerokość telefonu i brak błędów JavaScript (`tmp/r02-ui.log`); tymczasowe konta, oferty i zamówienia po teście usunięto.

## Granice tej poprawki

W momencie poprawki R02 plan był oparty na kalendarzu firmy i obsadzie przyjętej do wyceny. Kolejna poprawka R03 łączy go z rzeczywistymi pracownikami, grafikami i nieobecnościami oraz dodaje zapis nieobecności R05; szczegóły opisuje `r03-obsada-i-nieobecnosci-2026-10-26.md`. Nie zamknięto R04 ani pełnego edytora projektu R06 i wcześniejszego zakończenia R07. Historyczny raport z 25 października pozostaje zapisem stanu sprzed poprawek; niniejszy dokument aktualizuje R02.
