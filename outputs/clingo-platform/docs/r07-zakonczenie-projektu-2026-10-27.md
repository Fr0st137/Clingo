# R07 — wcześniejsze zakończenie projektu

Stan: 27 października 2026. R07 z raportu zgodności naprawiono lokalnie. Podstawa: „Zakres Clingo”, s. 9 i 32, oraz „Zamówienia Clingo”, s. 8, punkt 7.6: wykonawca oznacza projekt jako wykonany, a przyszłe sesje zostają dezaktywowane i zwalniają terminy.

## Wcześniej i teraz

Wcześniej publiczną rezerwację można było zakończyć dopiero po ostatnim zaplanowanym terminie. Starsze projekty miały akcje poszczególnych zleceń, bez zakończenia całego projektu i spójnego zwolnienia jego przyszłych sesji.

Teraz aktywny projekt ma w edytorze przycisk **Zakończ projekt**. Dostępny jest dla rezerwacji ze strony Clingo i przyjętych starszych zgłoszeń wielosesyjnych, także projektów pozostawionych z jedną sesją. Ze szczegółów sesji przycisk prowadzi do edytora całego projektu.

Po wybraniu akcji wykonawca widzi osobne potwierdzenie obejmujące całe zlecenie i zwolnienie pozostałych terminów. Musi zaznaczyć potwierdzenie i nacisnąć **Potwierdź zakończenie projektu**. Powrót do edytora nie zmienia danych. Niezapisane zmiany planu trzeba wcześniej zapisać lub odrzucić.

| Moment zakończenia | Zachowanie |
| --- | --- |
| Przed pierwszą sesją | Można jawnie oznaczyć całość jako wykonaną; wszystkie przyszłe sesje zostają zwolnione. |
| Podczas sesji | Cały projekt zostaje zakończony; trwająca sesja otrzymuje status wykonania, kolejne sesje zostają zwolnione. |
| Pomiędzy sesjami | Dotychczasowe terminy pozostają w historii, a przyszłe są zwalniane. |
| Po ostatnim terminie | Projekt można zakończyć bez oczekiwania na dodatkowe działania; lista zwolnionych przyszłych sesji jest pusta. |

Nie zmieniono zasad zwykłych rezerwacji jednosesyjnych: ich wcześniejsze zakończenie pozostaje zablokowane. R07 dotyczy całych projektów, również takich, które po edycji zawierają już tylko jedną sesję.

## Kalendarz, klient i historia

- Cały projekt otrzymuje status zakończenia i traci możliwość edycji harmonogramu oraz ponownego przyjęcia.
- Przyszłe sesje przestają blokować dostępność pracowników. W aktualnym kalendarzu/listach aktywnych nie pojawiają się jako zaplanowana praca; pozostają w historii.
- Przyszłe sesje są oznaczone jako **zwolnione po zakończeniu projektu**. Nie są oznaczane jako wykonane. Techniczny status sesji to `cancelled`, uzupełniony jawnym powodem `releasedByCompletion`.
- Sesje zwolnione w ten sposób są wyłączone ze statystyk wykonanych usług i odwołań, współczynnika odwołań oraz wartości utraconych przez odwołania. Zwykłe odwołania nadal są liczone według wcześniejszych zasad.
- Zakończenie aktualizuje status na koncie klienta. Szczegóły pokazują datę zakończenia, zachowany plan i oznaczenie zwolnionych sesji. Klient nie może już przełożyć tych terminów.
- Właściciel/administrator widzi moment zakończenia oraz liczbę zwolnionych sesji. Zapisywane są moment, autor i identyfikatory zwolnionych sesji. To osobny zapis zakończenia, niezależny od ograniczonej do 100 wpisów historii edycji harmonogramu.
- Wcześniej usunięte sesje zachowują swój dawny stan; nie są ponownie dopisywane do planu ani przypisywane nowemu zakończeniu.

Pierwotny plan, identyfikatory, daty, obsada, kontakt, udziały ceny i uzgodniona cena całego projektu pozostają zachowane. W widoku zakończonego projektu godziny i procent dotyczą ostatniego planu. Nie są ewidencją faktycznie przepracowanego czasu. Ta operacja nie dodaje rabatu, faktury, płatności ani automatycznego rozliczenia — te funkcje należą do R09.

## Bezpieczeństwo zapisu

Zakończenie wymaga roli właściciela lub administratora, własności projektu, aktualnej wersji i jawnego potwierdzenia. Oczekujących i odrzuconych zgłoszeń nie można oznaczyć jako wykonane.

Cała operacja odbywa się w jednej transakcji, z tą samą blokadą działalności i projektu co planowanie oraz zmiany obsady. Publiczna rezerwacja zmienia status źródłowego zamówienia; starszy projekt aktualizuje również wszystkie objęte nim aktywne zlecenia kalendarza.

Dwie równoczesne próby zakończenia dają jeden sukces i jeden konflikt, bez podwójnego zapisu daty. Równoczesna edycja i zakończenie również nie mogą nadpisać swoich zmian. Przy konflikcie panel umożliwia wczytanie aktualnego projektu.

Dawna akcja wykonania publicznej sesji nie omija potwierdzenia całego projektu. Zwolnionej sesji starszego projektu nie można ponownie uruchomić formularzem pojedynczego zlecenia. Informacje dla klienta nie zawierają autora zakończenia ani danych pracowników.

## Aktualizacja bazy i uruchomienie

Po wcześniejszych migracjach R01–R06, przed startem nowego API:

```powershell
npm run build:api
node scripts/migrate-project-completion.cjs
```

Skrypt wykonuje `apps/api/src/database/migrations/20261027-project-completion.sql`: rozszerza ograniczenie statusów `provider_multi_orders` o `completed`. Nie przepisuje statusów istniejących projektów. Dane zakończenia korzystają z istniejących pól JSON; nie dodano nowych kolumn. Skrypt obsługuje te same zmienne `POSTGRES_*` co migracja R06.

Migrację wykonano lokalnie dwukrotnie z powodzeniem (`tmp/r07-migration.log`). Należy zastosować ją także na innych środowiskach przed uruchomieniem tej wersji, również przy synchronizacji schematu. Nie wdrażano aplikacji na serwer zewnętrzny.

## Weryfikacja

- **122/122 testy** reguł projektów, rezerwacji, obsady, panelu wykonawcy, uprawnień, przekładania terminów i analiz — `tmp/r07-all-tests.log`.
- Produkcyjne kompilacje API, panelu wykonawcy i strony klienta — `tmp/r07-build-api.log`, `tmp/r07-build-provider.log`, `tmp/r07-build-web.log`.
- Rzeczywista baza PostgreSQL, API i przeglądarka — `scripts/verify-project-completion.cjs`, wynik `tmp/r07-integration.log`. Sprawdzono zakończenie wszystkich przyszłych sesji oraz projektu z sesją przeszłą, trwającą i przyszłą, a także projekt wyłącznie po terminach. Potwierdzono odzyskanie dostępności, zachowanie danych i ceny, status klienta, brak możliwości dalszej edycji, ochronę zwykłych rezerwacji, własność i role, równoczesne zapisy, ponowne wykonanie oraz zachowanie wcześniej usuniętych sesji. Oba rodzaje projektu sprawdzono także przez formularz; widok telefonu, komputera i ponowne otwarcie przeszły bez błędów JavaScript.
- Regresja edytora R06 i migracji historycznych danych — `tmp/r07-project-editor-regression.log`.
- Obrazy do kontroli wyglądu: `tmp/r07-completion-desktop.png`, `tmp/r07-completion-mobile.png`, `tmp/r07-customer-completed.png`.

Do ponowienia: `npm run test:projects` oraz `npm run verify:project-completion` przy działających lokalnych PostgreSQL/API/web/provider. Test integracyjny tworzy oznaczone, tymczasowe konta i usuwa swoje dane po zakończeniu.

## Następny punkt

R08: rzeczywisty kontakt i dostarczanie powiadomień o utworzeniu, zmianie i anulowaniu zlecenia. R07 nie uruchamia e-maili, SMS-ów ani czatu. Rozliczenia i fakturowanie pozostają R09.
