# Panel wykonawcy — dane działalności i zlecenia

Stan: 3 października 2026.

### Aktualizacja z 3 października

- `/services`: wygląd według Figmy `3556:5467`, oryginalne tło i ilustracje, lokalny font Inter, kafelki 185 × 219 px (rozszerzane w pionie przy długich nazwach). Kliknięcie kafelka otwiera dotychczasowy formularz API; „Dodaj ogłoszenie” tworzy szkic. Wyszukiwanie, szkice, archiwum i odświeżanie pozostają pod siatką. Statusy są rzeczywiste, więc przykładowe „Opublikowane” z Figmy nie jest przypisywane szkicom. Publikacja nadal wymaga osobnego wdrożenia.
- `/analytics`: analizy ręcznych zleceń z istniejącego, uwierzytelnionego API. Zakres 1–366 dni, filtry usług/pracowników, porównanie z poprzednim okresem, trzy miary wykresu, rankingi, wybór statusu lub przedziału, przejście do edycji i eksport wybranego zestawienia CSV. Wartość i czas dotyczą zakończonych zleceń, nie płatności ani ewidencji pracy. Nie pokazuje przykładowych ocen, obłożenia ani usług dodatkowych.
- `npm run test:provider-analytics`: obliczenia, granice dat, filtrowanie i CSV. `scripts/verify-provider-analytics.cjs`: przeglądarka z odizolowanymi odpowiedziami testowymi. `scripts/verify-provider-services-design.cjs`: rzeczywiste API/PostgreSQL, tymczasowe konto usuwane po teście, dodawanie/edycja/archiwum/przywracanie, konflikt wersji, kontrola wymiarów i grafik z Figmy oraz widok mobilny. Skrypty przeglądarkowe przyjmują `CLINGO_TEST_PROVIDER` i opcjonalną ścieżkę `CLINGO_PLAYWRIGHT`.

## Dostępne ekrany

- `/login`: logowanie istniejącym kontem Clingo, rejestracja, utworzenie własnej działalności. Nowa działalność zaczyna z pustą listą pracowników. Nie przypisujemy istniejących profili publicznych na podstawie nazwy ani e-maila.
- `/employees`: API, wyszukiwanie nazwiska/e-maila/telefonu również bez polskich znaków, wybór pracownika, kontakty, usługi i tygodniowy grafik.
- `/employees/add`: zapis nowego pracownika, kontaktu, kategorii sprzątania, widoczności w grafiku i siedmiu dni pracy.
- `/employees/edit?id=<uuid>`: edycja konkretnego pracownika, potwierdzenie usunięcia, komunikat konfliktu wersji i ponowne wczytanie. Formularz ostrzega przed zamknięciem karty i użyciem własnego linku „Wróć” z niezapisanymi zmianami; nawigacja boczna nie blokuje opuszczenia formularza.
- `/work-schedules`: dzień/tydzień, zmiana daty, dzisiaj, filtr pracownika i osób ukrytych, sumy tygodniowe i miesięczne, CSV, przejście do edycji. Grafik powtarza ustawiony tydzień; suma miesięczna uwzględnia faktyczną liczbę poszczególnych dni miesiąca.

- `/clients`: własna kartoteka firmy, dodawanie i edycja kontaktu, jednego adresu oraz wielowierszowych notatek; wyszukiwanie po nazwie, e-mailu, telefonie i adresie, również bez polskich znaków. Odświeżanie listy, stany puste/błędy, potwierdzenie odrzucenia zmian i wczytanie nowszej wersji przy konflikcie. Karta klienta pokazuje jego ręcznie dodane zlecenia i otwiera ich edycję. Kartoteka nie tworzy kont klienta ani publicznej rezerwacji.
- `/settings`: nazwa działalności, dane kontaktowe i osoby kontaktowej; nazwa od razu aktualizuje menu. Zmiana hasła korzysta z istniejącej rotacji sesji w AuthService. Eksport JSON zawiera zapisane dane firmy, preferencje oraz pracowników z grafikami (nie obejmuje kartoteki klientów, zamówień ani całego konta klienta). Zmiana loginu, powiązanie profilu publicznego oraz usunięcie konta nadal są niedostępne i opisane.
- `/settings/notifications`: niezależne preferencje e-mail/SMS dla utworzenia, zmiany, odwołania zlecenia i marketingu. Nowe konto zaczyna ze wszystkimi opcjami wyłączonymi. Zapis preferencji nie uruchamia wysyłki wiadomości; ekran wyjaśnia ten zakres. Ustawienia mają niezależne wersje dla danych firmy i powiadomień oraz ostrzeżenia przed opuszczeniem niezapisanego formularza.

- `/services`: własne szkice usług z nazwą, kategorią, opisem, ceną za usługę w PLN i czasem trwania. Tworzenie, edycja, wyszukiwanie nazwy/kategorii/opisu bez polskich znaków, przeniesienie do archiwum i przywracanie. Cena w bazie jest całkowitą liczbą groszy; czas wynosi 15–1440 minut. Szkice ani archiwum nie są publikowane w katalogu klienta. Zapis sprawdza wersję danych; formularz pozwala wczytać aktualne dane po konflikcie. Brak trwałego usuwania usług.
- `/settings/location`: adres wyjściowy w Polsce i promień dojazdu 0–100 km, suwak i pole liczbowe, zapis przypisany do działalności, niezależny licznik wersji i obsługa konfliktów. Nie korzysta z przykładowej mapy Warszawy. Geokodowanie, mapa i wykorzystanie promienia w wyszukiwarce publicznej pozostają do wdrożenia.
- `/orders`: układ listy i małego kalendarza z Figmy 3931:6088. Daty, licznik, karty i filtry statusu/usługi korzystają z zapisanych ręcznych zleceń działalności; kliknięcie karty otwiera edycję. `/orders/history` pokazuje zakończone i odwołane zlecenia. Dodawanie i edycja łączy własnego klienta, szkic usługi i opcjonalnego pracownika, zapisuje datę, godzinę, czas, kwotę, notatki oraz status. Widok szczegółów używa zapisanej kopii kontaktu, adresu i nazwy usługi, więc późniejsza edycja kartoteki nie zmienia historii.
- `/orders/multi-session`: brak modelu wielosesyjnego w API. Ekran informuje o niedostępności funkcji zamiast pokazywać przykładowych klientów i kwoty; stary adres szczegółów wraca na tę stronę.
- `/`, `/calendar/week` i `/calendar/day`: jeden kalendarz z zapisanymi zleceniami w widoku miesiąca, tygodnia lub dnia. Można przechodzić między okresami, filtrować dane, otwierać edycję i dodać zlecenie bezpośrednio dla wybranej daty.

Pasek boczny pokazuje zalogowaną działalność zamiast przykładowej osoby, oceny i następnego zlecenia. Wylogowanie unieważnia sesję na serwerze. Pozostałe ekrany zachowują istniejące widoki i mają oznaczenie danych przykładowych.

## Uruchomienie

1. Uruchom lokalne PostgreSQL, Redis i API, np. głównym launcherem projektu. Panel nie zastępuje niedostępnego API danymi przykładowymi.
2. Dla bazy z `TYPEORM_SYNC=false` zastosuj kolejno migracje z `apps/api/src/database/migrations`: `20260924-provider-team.sql`, `20260925-provider-settings.sql`, `20260925-provider-clients.sql`, `20260928-provider-offers-location.sql`, `20260929-provider-jobs.sql`, `20261003-provider-offer-configuration.sql`, `20261003-provider-reviews.sql`, `20261003-provider-multi-orders.sql`. Dodają tabele zespołu, klientów, usług, opinii, zleceń wielosesyjnych i ręcznych zleceń oraz kolumny ustawień i konfiguracji ogłoszenia; nie przepisują istniejących zamówień klientów, użytkowników ani katalogu. Lokalny `TYPEORM_SYNC=true` dodaje encje przy uruchomieniu API; nie włączaj synchronizacji na produkcji.
3. Najprościej uruchom główny `start-clingo-provider.bat`. Skrypt włącza Docker Desktop, PostgreSQL/PostGIS, Redis i API, czeka na ich gotowość, a następnie otwiera panel na porcie 3001. Ręczne `npm run dev:provider` uruchamia wyłącznie frontend i nadal wymaga osobno działającego API.
4. Zaloguj się swoim kontem Clingo i podaj nazwę działalności. Dla innego backendu ustaw serwerowe `API_URL` w `apps/provider/.env.local`; domyślnie `http://localhost:4000`.

Panel klienta zachowuje własną sesję. Panel wykonawcy ma oddzielne ciasteczko `clingo-provider-session`, HttpOnly, SameSite=Lax i Secure na HTTPS. Proxy przepuszcza wyłącznie jawnie określone operacje, sprawdza Origin przy zapisie, ogranicza formularze do 16 KB i nie zwraca tokenów w JSON.

## Własność danych

`provider_accounts` przechowuje działalności, `provider_memberships` wiąże użytkownika z działalnością i rolą, `provider_employees` przechowuje kontakty, kategorie usług i tygodniowy grafik. Pierwsza wersja dopuszcza jedną działalność na login. Utworzenie działalności i członkostwa jest transakcją; unikalność członkostwa chroni przed podwójnym utworzeniem.

`provider_offers` przechowuje szkice i archiwum usług; `provider_accounts.location` i `location_revision` przechowują adres, promień i wersję niezależną od danych firmy. `provider_clients` przechowuje kontakty, adresy i notatki; `provider_accounts` również dane działalności i preferencje. `provider_jobs` łączy rekordy należące do tej samej działalności i zachowuje kopię danych potrzebnych do historii. Usunięcie pracownika zeruje powiązanie, ale pozostawia jego nazwę na dawnym zleceniu.

Każdy odczyt i zapis pracowników, klientów, usług, zleceń oraz ustawień wymaga aktualnej sesji i roli owner/admin. ID działalności pochodzi z członkostwa na serwerze. Edycja i usunięcie warunkowo sprawdzają `revision`; nieaktualny formularz otrzymuje 409. Brak lub cudzy identyfikator daje błąd bez ujawniania danych innej działalności. Zapis zlecenia blokuje rekord działalności na czas sprawdzenia kolizji, dlatego dwa równoczesne zapisy nie mogą przydzielić pracownikowi nakładających się terminów. Przyszłego zlecenia nie można oznaczyć jako zakończone. Preferencje i dane firmy mają osobne liczniki wersji; mogą być aktualizowane niezależnie. Nie ma publicznego endpointu nadawania ról. Rekord pracownika nie tworzy konta ani zaproszenia.

## Kolejne etapy

- Jawne powiązanie działalności z publicznym profilem i zamówieniami, bez przejmowania profili przykładowych.
- Połączenie ręcznych zleceń z rezerwacjami klientów i wspólną dostępnością. Obecny grafik zespołu i ręczne zlecenia nie zmieniają jeszcze algorytmu booking ani istniejących rezerwacji klientów.
- Nieobecności i wyjątki dla konkretnych dat. Aktualnie nie pokazujemy fikcyjnego obłożenia zleceniami.
- Zaproszenia i uprawnienia pracowników, zdjęcia oraz pozostałe moduły panelu.

## Weryfikacja i granice

- Kompilacja API i produkcyjna kompilacja panelu.
- `npm run test:provider-team`: 43 testy walidacji, uprawnień, izolacji działalności, konkurencyjnego zapisu, klientów, usług, zleceń, kolizji terminów, migawek danych, cen, archiwizacji, lokalizacji, danych i preferencji firmy, zakresu eksportu, rotacji ciasteczka, sum godzin/dat, CSV i ochrony proxy. Testy serwisu korzystają z repozytoriów w pamięci; testy proxy symulują backend.
- `npm run verify:provider-team`: przygotowany test HTTP + PostgreSQL. Tworzy odizolowany schemat, sprawdza dwukrotne zastosowanie migracji, rzeczywiste logowanie, równoczesne tworzenie działalności, role, cudze rekordy, konkurencyjne zapisy oraz odczyt SQL z osobnego połączenia. Obejmuje klientów, usługi, zlecenia, ustawienia, eksport i zmianę hasła z unieważnieniem poprzedniej sesji; sprawdza też blokadę kolizji i zachowanie historii po usunięciu pracownika. Usuwa wyłącznie swój losowo nazwany schemat. Korzysta ze zmiennych `POSTGRES_*`, domyślnie z lokalnej bazy na porcie 55432. Nie wymaga działającej instancji API — uruchamia własną na wolnym porcie.
- Przeglądarka na osobnych portach testowych: logowanie, pusty panel, dodanie, odczyt, wyszukiwanie, edycja godzin klawiaturą, suma minut i widok tygodnia. Sprawdzony układ desktopowy i mobilny 390 px. Dodatkowo sprawdzono kartotekę klientów (utworzenie, odczyt po odświeżeniu, wyszukiwanie, edycja, konflikt dwóch okien, odrzucenie zmian i wczytanie aktualnej wersji) oraz ustawienia firmy i preferencje. Poprawiono widoczność przycisku zamknięcia formularza klienta na telefonie. W pakiecie z 28 września sprawdzono tworzenie, archiwizację i przywrócenie usług, cenę z przecinkiem, wyszukiwanie, konflikt ceny i ponowne wczytanie; dla lokalizacji zapis adresu i zasięgu, konflikt, suwak klawiaturą i odczyt po odświeżeniu. W pakiecie z 29 września sprawdzono utworzenie i edycję zlecenia, blokadę nakładającego się terminu, oznaczenie zakończenia, historię klienta, edycję z karty klienta oraz ten sam rekord w kalendarzu miesiąca, tygodnia i dnia. Dodawanie z dnia ustawia właściwą datę. Lista zleceń i formularz nie mają poziomego przepełnienia przy szerokości 390 px. Pomocniczy backend przechowywał wyłącznie tymczasowe dane testowe w pamięci; nie jest częścią aplikacji.
- Treść CSV sprawdzona testem; automatyzacja wbudowanej przeglądarki nie potwierdziła zdarzenia pobrania pliku.
- 29 września przyczyną niedostępności bazy były zatrzymane kontenery po restarcie Docker Desktop oraz launcher panelu uruchamiający sam frontend. Kontenery mają teraz politykę `restart: unless-stopped`, a `start-clingo-provider.bat` uruchamia i sprawdza całą warstwę danych oraz API. Po naprawie `npm run verify:provider-team` przeszedł na rzeczywistym PostgreSQL, potwierdzając migracje, transakcje, izolację działalności i trwałość zapisów. Dodatkowy test całego panelu utworzył przez interfejs pracownika z grafikiem, usługę, klienta i powiązane zlecenie; wszystkie rekordy przetrwały odświeżenie, wylogowanie oraz ponowne logowanie, pojawiły się w kalendarzu i zostały potwierdzone bezpośrednim odczytem SQL. Odizolowane dane testowe zostały następnie usunięte.




