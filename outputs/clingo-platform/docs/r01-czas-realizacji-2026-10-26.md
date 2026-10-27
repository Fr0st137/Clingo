# R01 — czas realizacji według obsady

W kodzie poprawiono obliczanie szacowanego czasu dla opublikowanych ofert i nowych rezerwacji.

- Do publicznej oferty trafiają widełki metrażu z liczbą osób.
- Czas = powierzchnia × czas jednej osoby dla 100 m² / 100 / liczba osób z przedziału.
- Wynik jest zaokrąglany w górę do dotychczasowej siatki 15 minut, z minimum 15 minut.
- Przykład: 100 m², 180 minut jednej osoby, obsada 2 osoby → 90 minut realizacji. Cena powierzchniowa pozostaje taka sama.
- Dla ułamkowego metrażu cena i nakład pracy pozostają dokładne; wyłącznie wybór przedziału całkowitego metrażu używa zaokrąglenia w górę, np. 50,5 m² trafia do przedziału zaczynającego się od 51 m².
- Dotychczasowe reguły czasu i ceny dodatków pozostają zachowane.
- Nowa rezerwacja zapisuje liczbę osób przyjętą do obliczenia czasu. Późniejsza zmiana oferty nie zmienia tej liczby ani umówionego czasu istniejącego zamówienia.
- Informacja o założonej obsadzie jest widoczna w podsumowaniu oferty klienta, wyborze terminu, podsumowaniu rezerwacji i szczegółach zamówienia wykonawcy.
- Mechanizm planowania wielosesyjnego korzysta z tej samej liczby osób. Późniejsza poprawka R02 dodaje publikację pełnego metrażu i automatyczny podział na sesje; przydział pracowników R03 pozostaje osobnym zadaniem.

## Weryfikacja

- 23/23 testy rezerwacji, wyliczeń powierzchniowych i przenoszenia parametrów oferty — zaliczone (`tmp/r01-tests.log`).
- 52/52 testy podstawowych modułów wykonawcy — zaliczone (`tmp/r01-provider-tests.log`).
- Kompilacja API i produkcyjnego panelu wykonawcy — zaliczone.
- Produkcyjna kompilacja strony klienta — zaliczona po przywróceniu PostgreSQL podczas prac nad R02.
- Przeglądarka: metraże 50/100/151 m², odpowiednio 1/2/3 osoby i właściwe czasy; widok telefonu i szczegóły wykonawcy — sprawdzone na kontrolowanych odpowiedziach API, bez błędów JavaScript (`tmp/r01-ui.log`).
- Test zapisu na kontrolowanym repozytorium sprawdza rzeczywiste wykonanie kodu rezerwacji, jej czas, liczbę osób i zachowanie danych po zmianie oferty. Podczas prac nad R02 dodatkowo przeszedł test HTTP/PostgreSQL (`tmp/r02-publication.log`), obejmujący migrację, zapis rezerwacji i zachowanie wcześniejszych parametrów po zmianie oferty.

## Stan aktualizacji istniejących danych

Przygotowano idempotentną migrację `apps/api/src/database/migrations/20261026-offer-staffing-estimate.sql`. Dołącza istniejące widełki do publicznych ofert utworzonych z usługi należącej do tego samego konta. Nie zmienia dat, cen ani czasu już zapisanych zamówień. Niezależne starsze profile bez widełek zachowują dotychczasowe obliczenie dla jednej osoby.

**Aktualizacja podczas R02: migracja została zastosowana do lokalnej bazy razem z migracją R02.** Po uzyskaniu zgody użytkownika przywrócono Docker przez zachowanie katalogów pustych, zablokowanych gniazd pod nazwami kopii i ponowny start. Nie resetowano wolumenów. Przed aktualizacją zapisano kopię kwalifikujących się publicznych konfiguracji; w lokalnej bazie było ich 0. Test HTTP/PostgreSQL zakończył się powodzeniem. Skrypt `verify-publication.cjs` sprawdza migracje dwukrotnie na własnej tymczasowej ofercie, czas rezerwacji, założoną obsadę i zachowanie wcześniejszego zamówienia po zmianie konfiguracji.

Nowo publikowane lub ponownie zapisane i opublikowane oferty korzystają z nowej konfiguracji od razu. Wcześniej opublikowane oferty wymagają migracji albo ponownego zapisania publikacji po uruchomieniu aplikacji.

Publikację pełnego metrażu i automatyczną klasyfikację projektów poprawiono w R02. Kolejna poprawka R03 dodaje przydział konkretnych osób, grafiki i nieobecności oraz zapis nieobecności R05. Założona liczba osób nadal oznacza parametr wyceny; rzeczywista obsada jest zapisywana oddzielnie dla terminu/sesji i może być zmieniona przez wykonawcę. Limit obsady w konfiguracji oferty R04 pozostaje osobnym zadaniem.
