# R06 — edycja projektu i bilans pracy

Stan: 27 października 2026. R06 z raportu zgodności został naprawiony lokalnie. Podstawa: „Zakres Clingo”, s. 8–9 i 31–33, oraz „Zamówienia Clingo”, s. 6–8, zwłaszcza punkty 7.1–7.4. Wcześniejsze zakończenie, dostarczanie powiadomień i rozliczenia pozostają osobnymi punktami R07–R09.

## Przed i po

Wcześniej dostępne były listy projektów i pojedynczych sesji oraz wybrane akcje terminów i statusów. Brakowało wspólnego formularza zmiany harmonogramu, obsady wielu osób i bilansu pracy. Starsze zgłoszenia po przyjęciu tworzyły sesje z pojedynczym pracownikiem.

Teraz z **Zlecenia → Zlecenia wielosesyjne** oraz ze szczegółów sesji można otworzyć **Edytor projektu**. Ten sam mechanizm obsługuje rezerwacje klientów ze strony Clingo i wcześniejsze zgłoszenia wielosesyjne. Zgłoszenie można poprawić przed przyjęciem, a przyjęcie ponownie sprawdza dostępność i zapisuje konkretne osoby w kalendarzu. Projekt pozostaje dostępny w edytorze także po zredukowaniu do jednej sesji.

| Funkcja z zakresu | Obecne działanie |
| --- | --- |
| Wielu pracowników w sesji | Każda aktywna sesja ma przynajmniej jedną osobę. Zmiana zespołu przelicza pracę. |
| Wymagane, zaplanowane, pozostało i postęp | Praca zaplanowana = suma rzeczywistego czasu sesji × liczba osób. Widoczne są wartości: wymagane, zaplanowane, pozostało, nadmiar. |
| Nadmiar | Można zapisać np. 55 h przy wymaganych 50 h. Procent pokazuje 110%; wypełnienie paska zatrzymuje się na jego szerokości. Nadmiar wymaga jawnego potwierdzenia. |
| Niedobór | Ostrzeżenie podaje brakującą pracę. Zapis wymaga zgody na realizację na własne ryzyko. Serwer sprawdza tę zgodę niezależnie od formularza. |
| Nowe i usuwane sesje | Można dodawać sesje oraz usuwać przyszłe. Minimalna długość po stronie wykonawcy wynosi minutę; klientowy wymóg 3 godzin nie ogranicza edytora. Projekt zachowuje co najmniej jedną sesję. |
| Godziny i dzień | Przyszłą sesję można przełożyć i skrócić lub wydłużyć. Po rozpoczęciu można zmienić tylko koniec na godzinę późniejszą od bieżącej. Zakończony termin jest niezmienny. |
| Powierzchnia | Zmiana powierzchni aktualizuje wymaganą pracę i procent pokrycia. Przyjmowane są dwie cyfry po przecinku. |
| Informacja dla klienta | Przed zapisem zmian widoczne jest zalecenie uzgodnienia harmonogramu. Zapis zmienia terminy na koncie klienta. |

Przykład: sesja 4 h dla 3 osób daje 12 roboczogodzin. Odjęcie osoby zmniejsza plan do 8 roboczogodzin. Wymagana praca pozostaje stała do zmiany powierzchni; zmiana obsady nie przepisuje podstawy obliczeń.

Dodawanie jest dostępne dla aktywnego projektu także przy już przekroczonej wymaganej pracy. Obowiązują ograniczenia techniczne: maksymalnie 186 sesji, 50 osób w sesji i sześciomiesięczny horyzont nowych terminów. Sesje mieszczą się w jednym dniu, z możliwością zakończenia o północy następnego dnia. Rzeczywisty czas uwzględnia zmianę czasu w Polsce. Przerwa dłuższa niż dwa pełne dni jest oznaczana ostrzeżeniem; ręczna edycja wykonawcy dopuszcza taki harmonogram, a automatyczny plan klienta zachowuje dotychczasowe ograniczenie.

## Dostępność i spójność

- Zmieniany lub nowy termin sprawdza grafik, uprawnienia do rodzaju usługi, nieobecności, inne projekty, ręczne zlecenia i bufory. Sesje jednego projektu nie mogą na siebie nachodzić.
- Niezmieniony przydział pozostaje ważny mimo późniejszego dodania nieobecności. Skrócenie trwającej sesji zachowuje jej obsadę; wydłużenie wymaga dostępności na dodatkowy czas.
- Zapis całego projektu jest jedną transakcją. Równoczesne zapisy kończą się jednym sukcesem i konfliktem drugiego zapisu. Starszy formularz klienta również dostaje konflikt po zmianie projektu przez wykonawcę.
- Sesje mają trwałe identyfikatory: usunięcie wcześniejszej sesji nie zmienia odnośnika do kolejnej. Usunięcie przyszłej sesji zwalnia jej zajętość.
- Starsze przyjęte zgłoszenia synchronizują kalendarz i pełny zespół. Nie można usunąć z kartotek pracownika przypisanego jako druga lub kolejna osoba.
- Dawny formularz pojedynczego zlecenia nie pozwala zmienić harmonogramu projektu z pominięciem bilansu. Nadal można dopisać notatkę i oznaczyć sesję jako wykonaną po jej terminie; zachowana jest pełna obsada, a wersja projektu rośnie.
- Edycja wymaga roli właściciela lub administratora i jest ograniczona do własnej działalności. Dane pracowników nie trafiają do widoku klienta.

Zapisywana jest historia ostatnich 100 zmian planu wraz z dodanymi, usuniętymi i zmienionymi sesjami, zmianą powierzchni oraz potwierdzeniami bilansu. Jest to historia harmonogramu, a nie pełny dziennik wszystkich działań na koncie.

## Obliczenia, cena i starsze dane

Nowe rezerwacje zapisują niezmienną podstawę pracy z chwili zamówienia: wydajność na metr kwadratowy i pracę usług dodatkowych. Późniejsza zmiana konfiguracji oferty nie zmienia tej podstawy. Zmiana powierzchni przelicza część powierzchniową, pozostawiając pracę dodatków.

W starszych projektach bez takiej podstawy wymagane godziny są odtwarzane z historycznego planu i oznaczone jako historyczne. Przy zapisanej powierzchni można je proporcjonalnie przeliczać; bez niej pole powierzchni jest zablokowane. Nie jest to odtworzenie nieistniejącej, pierwotnej konfiguracji oferty.

Uzgodniona całkowita cena pozostaje zachowana. Edytor informuje, że inną kwotę należy ustalić osobno. Udziały ceny są rozdzielane między pozostałe przyszłe sesje z zachowaniem groszy; kwoty zakończonych sesji pozostają niezmienne. Jeżeli pozostają wyłącznie zakończone sesje, nieprzydzielona część ceny nie jest dopisywana do historii. Rabaty, ostateczne rozliczenie i faktury należą do R09.

## Aktualizacja bazy

Po wcześniejszych migracjach i kompilacji API należy uruchomić:

```powershell
node scripts/migrate-project-estimates.cjs
```

Skrypt korzysta z lokalnych ustawień PostgreSQL lub zmiennych `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`. Dodaje pola według `apps/api/src/database/migrations/20261027-project-editor.sql`, utrwala historyczne podstawy obliczeń i identyfikatory sesji oraz uzupełnia obsadę starszych ręcznych sesji. Powierzchnia ręcznego projektu obsługuje części dziesiętne.

Przed zmianami skrypt zapisuje kopię obejmowanych danych w `tmp/backups/r06-projects-*.json`; zmiany i blokady tabel są objęte transakcją. Aktualizację należy wykonać przed uruchomieniem nowej wersji API, także przy włączonej synchronizacji schematu. Na środowisku docelowym należy wcześniej wykonać normalną kopię bazy.

W lokalnej bazie początkowo nie było powiązanych projektów wymagających uzupełnienia. Osobny test tworzy starego typu projekt publiczny i ręczny, wykonuje skrypt dwukrotnie i potwierdza zachowanie terminów, obsady oraz ceny, poprawną powierzchnię dziesiętną, a następnie brak kolejnych zmian. Nie wykonano wdrożenia na zewnętrzny serwer.

## Weryfikacja

- **117/117 testów** rezerwacji, projektów, obsady, uprawnień, panelu wykonawcy, analiz i przekładania terminów: `tmp/r06-all-tests.log`.
- Produkcyjne kompilacje API, panelu wykonawcy i strony klienta: `tmp/r06-build-api.log`, `tmp/r06-build-provider.log`, `tmp/r06-build-web.log`.
- Rzeczywista baza PostgreSQL, API i przeglądarka: `scripts/verify-project-editor.cjs`, wynik w `tmp/r06-integration.log`. Sprawdzono bilans, potwierdzenia, powierzchnię, minutowe sesje, trwałe odnośniki, kolizje i nieobecności, obce konta i role, równoczesne wersje, zgłoszenie przed/po przyjęciu, wiele osób, notatkę do krótkiej sesji, zakończenie po terminie, wejście do edytora z listy oraz odzyskanie aktualnych danych po konflikcie. Bez błędów JavaScript; sprawdzono układ telefonu i komputera.
- Dwukrotne uzupełnienie historycznych danych na tymczasowych projektach: `tmp/r06-migration-fixtures.log` — pierwszy przebieg uzupełnił po jednym projekcie każdego typu, drugi nie zmienił żadnego.
- Regresja rezerwacji klienta, formularzy nieobecności i zmiany obsady w przeglądarce: `tmp/r06-booking-regression.log`.
- Regresja publikacji i zapisanych wycen R01/R02: `tmp/r06-publication.log`.

Polecenia do ponowienia: `npm run test:projects` i przy działających lokalnych aplikacjach `npm run verify:projects`. Testy integracyjne tworzą własne, oznaczone konta i usuwają swoje dane po zakończeniu.

## Następny punkt

Aktualizacja z 27 października realizuje R07: wcześniejsze zakończenie całego projektu i zwolnienie przyszłych terminów opisuje [raport R07](r07-zakonczenie-projektu-2026-10-27.md). Następny punkt to kontakt i dostarczanie powiadomień R08. Rabaty i fakturowanie pozostają R09.
