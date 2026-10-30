# R12 — połączenie opinii klienta i wykonawcy

R12 naprawiono w lokalnej aplikacji. Opinie wystawiane po zakończonej rezerwacji mają wspólny odczyt po stronie klienta, wykonawcy i publicznego katalogu.

## Problem i rozwiązanie

Wcześniej klient zapisywał opinię w `customer_reviews`, a panel wykonawcy i jego sidebar korzystały wyłącznie z `provider_reviews`. Publiczny katalog, profile i awaryjny odczyt bazy także różniły się sposobem liczenia ocen. W rezultacie jedna firma mogła mieć różne liczby opinii i średnie w różnych miejscach.

Teraz opinia klienta pozostaje w swoim źródłowym rekordzie. Nie jest kopiowana do drugiej tabeli, więc zmiana treści, oceny lub zdjęć i usunięcie opinii mają jeden skutek po obu stronach. Zachowano także istniejące, odrębne starsze opinie przypisane firmie w `provider_reviews`.

## Obecne działanie

- Klient wystawia opinię wyłącznie do własnego, oznaczonego jako wykonane zamówienia. Sam upływ terminu ani anulowanie nie umożliwiają oceny.
- Jedno zamówienie ma jedną opinię, także gdy projekt obejmuje wiele sesji. Kolejny zapis edytuje istniejącą opinię.
- Panel wykonawcy pokazuje opinie klienta, autora w postaci imienia i inicjału nazwiska, usługę, ocenę, treść i zdjęcia. Działają istniejące filtry oraz wyszukiwanie.
- Sidebar i lista opinii korzystają z tego samego zbioru. Panel odświeża opinie i podsumowanie co 15 sekund podczas przeglądania oraz po powrocie do karty.
- Ocena dotyczy całej firmy. Jej ogłoszenia, profile publiczne, kafelki katalogu i pozycje w ulubionych pokazują wspólną średnią i liczbę ocen ze wszystkich powiązanych usług.
- Awaryjny odczyt katalogu i profilu bezpośrednio z PostgreSQL korzysta z tych samych zapytań i obliczeń co API.
- Usunięcie opinii klienta usuwa jej zdjęcia i przestaje uwzględniać ją we wszystkich podsumowaniach. Brak opinii daje pusty stan, bez zastępczej oceny.
- Naprawiono powrót z formularza klienta po zapisie i usunięciu opinii. Lista jest pobierana ponownie, zamiast pozostawać na ekranie edycji mimo udanego zapisu.

Dla firmy połączonej z kontem wykonawcy średnia wynika z rzeczywistych rekordów opinii. Nie dodajemy do niej ponownie zapisanych w katalogu przykładowych liczników ani osadzonych przykładów. Te dane nie są usuwane z bazy. Niezależne starsze profile bez powiązanego konta zachowują wcześniejsze zasady swoich historycznych ocen, powiększanych o nowe opinie klientów.

## Zgłoszenia i uprawnienia

Właściciel i administrator mogą zgłosić lub cofnąć zgłoszenie zarówno starszej opinii, jak i opinii klienta. Pracownik może je odczytać, lecz nie zgłaszać. Operacje są ograniczone do własnej firmy. Zgłoszenie nie ukrywa opinii i nie usuwa jej z obliczeń oceny.

Opinia klienta otrzymała numer wersji. Zgłoszenie sprawdza wersję i datę ostatniej zmiany, pod blokadą zamówienia. Nieaktualny widok nie nadpisuje nowszej opinii. Zmiana treści, oceny albo zdjęć przez klienta usuwa stare oznaczenie zgłoszenia i zwiększa wersję. Identyczne ponowienie zapisu zachowuje datę, wersję i stan zgłoszenia. Samo zgłoszenie nie zmienia daty edycji widocznej publicznie.

Zdjęcia w panelu korzystają z osobnego, uwierzytelnionego adresu, który sprawdza firmę, zamówienie i zdjęcie. Inne konto wykonawcy nie uzyska go tą drogą. Publiczna prezentacja zdjęć na profilu pozostaje zgodna z informacją pokazywaną klientowi przy wystawianiu opinii. Publiczne odpowiedzi nie zawierają e-maila autora ani prywatnego stanu zgłoszenia.

Zgłoszenie zachowuje dotychczasową funkcję oznaczenia do moderacji. R12 nie uruchamia zewnętrznej obsługi moderatorów, czatu ani wysyłek e-mail/SMS z R08.

## Aktualizacja bazy

Przed uruchomieniem nowej wersji API, po wcześniejszych migracjach:

```powershell
node scripts/migrate-review-bridge.cjs
```

Skrypt dodaje do `customer_reviews` pola `provider_reported` i `revision` według `apps/api/src/database/migrations/20261027-review-bridge.sql`. Zapisuje kopię danych w `tmp/backups/r12-reviews-*.json`, wykonuje migrację dwukrotnie w transakcji i sprawdza, że wcześniejsze treści, oceny, powiązania, zdjęcia i daty są zachowane.

Migrację zastosowano lokalnie. Sprawdzono ją również dwukrotnie na trzech tymczasowych opiniach, w tym zgłoszonej. Nie resetowała istniejącego zgłoszenia ani wersji. Należy wykonać ją na pozostałych środowiskach przed startem tej wersji, także przy synchronizacji schematu. Nie wykonano wdrożenia na zewnętrzny serwer.

## Weryfikacja

- **129/129 testów** — projekty, rezerwacje, obsada, panel wykonawcy, opinie, uprawnienia, proxy obrazów i analizy. Wynik: `tmp/r12-all-tests.log`.
- Kompilacja API i produkcyjnej strony klienta oraz sprawdzenie typów panelu wykonawcy — zaliczone. Logi kompilacji: `tmp/r12-build-api.log`, `tmp/r12-build-web.log`.
- `scripts/verify-review-bridge.cjs` — prawdziwa baza, API i przeglądarka: klient wystawia, edytuje i usuwa opinię ze zdjęciem; panel odświeża dane; oba ogłoszenia, katalog, ulubieni i odczyt awaryjny pokazują te same wartości. Sprawdzono jedną opinię dla projektu wielosesyjnego, zachowanie starszych opinii, brak kopiowania do drugiej tabeli, współbieżne zapisy, role, dostęp do zdjęć, zgłoszenia i puste stany. Bez błędów JavaScript. Wynik: `tmp/r12-integration.log`.
- `scripts/verify-account.cjs` — regresja opinii do wykonanych usług, walidacji, zdjęć, prywatności, niezależnych profili katalogowych oraz pozostałych funkcji konta. Wynik: `tmp/r12-customer-regression.log`.
- Migracja i zachowanie danych — `tmp/r12-migration.log`, `tmp/r12-migration-fixtures.log`.
- Widok opinii ze zdjęciem po stronie wykonawcy — `tmp/r12-provider-review.png`.

Testy integracyjne tworzą własne, oznaczone konta i usuwają swoje dane po zakończeniu. Do ponowienia: `npm run test:review-bridge` oraz `npm run verify:review-bridge` przy działających lokalnych PostgreSQL/API/web/provider.
