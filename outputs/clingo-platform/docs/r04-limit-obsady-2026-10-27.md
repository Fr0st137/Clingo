# R04 — limit obsady w widełkach

Wprowadzono model sposobu pracy i kontrolę liczby osób przy konfiguracji usług. Poprawka odpowiada wymaganiu z zakresu: obsada przedziału nie przekracza deklaracji wykonawcy, a praca samodzielna oznacza jedną osobę.

## Zasady po zmianie

- W ustawieniach „Twoje dane” dodano sekcję „Obsada i sposób pracy”: praca samodzielna albo zespół.
- Praca samodzielna oznacza limit jednej osoby w każdym przedziale i maksymalnie jedną kartotekę wykonującej usługi osoby. Właściciel pracujący samodzielnie dodaje własną kartotekę i grafik; nie tworzymy fikcyjnego pracownika.
- Dla zespołu domyślny limit odpowiada liczbie dodanych osób. Można również zapisać własną deklarację od 1 do 50. Efektywny limit jest mniejszą z wartości: deklaracja, liczba kartotek i dotychczasowe maksimum systemowe 50.
- Deklaracja może przewidywać rozwój zespołu, np. 3 osoby przy 2 kartotekach, ale widełki nadal dopuszczą najwyżej 2 osoby. Dodanie trzeciej osoby podnosi ten limit do 3. Dodanie kolejnej ponad jawnie zapisaną deklarację wymaga najpierw zmiany ustawień.
- Deklaracji nie można zmniejszyć poniżej liczby istniejących kartotek. Tryb samodzielny wymaga uporządkowania zespołu do jednej osoby.
- Dla nowego konta bez pracowników można przygotować szkic z obsadą 1. Domyślne widełki nowego szkicu są dostosowane do limitu. Publikacja wymaga co najmniej jednej kartoteki; jej rzeczywista dostępność zależy od grafików, usług i nieobecności według R03.
- Jawnie przesłana konfiguracja ponad limit jest odrzucana zarówno przy tworzeniu szkicu, jego zmianie, jak i publikacji. Serwer nie obcina jej automatycznie.
- Przyciski zwiększania liczby osób w konfiguracji usługi zatrzymują się na limicie działalności. Edytor pokazuje limit, odnośnik do ustawień i możliwość jego odświeżenia. Starsze błędne widełki można zmniejszyć; próba zapisu bez ich poprawienia pokazuje błąd.

## Zmniejszanie zespołu i starsze oferty

Usunięcie osoby jest blokowane, jeśli aktualne szkice lub opublikowane usługi wymagałyby większego zespołu. Komunikat wskazuje usługi do poprawienia. Przed usunięciem ostatniej osoby trzeba wycofać opublikowane usługi. Nadal działa blokada R03 dla osoby z aktywnymi przypisanymi terminami.

Oferty archiwalne zachowują dawną konfigurację i nie blokują redukcji. Próba przywrócenia ich do szkicu lub publikacji ponownie sprawdza aktualne limity. Błędną starszą ofertę można wycofać z publikacji bez zmiany jej widełek.

Starsze opublikowane profile z obsadą ponad limit są wykluczone z katalogu i odczytu publicznego do czasu poprawy. Ta sama reguła działa w awaryjnym odczycie strony klienta z bazy. Nowa rezerwacja ani wycena nie omija ograniczenia przez bezpośrednie wskazanie identyfikatora profilu. Konfiguracja i status publikacji nie są automatycznie przepisywane.

Zmiany deklaracji, pracowników i konfiguracji usług korzystają z tej samej blokady konta w bazie. Test równoczesnego zwiększenia obsady oferty i usunięcia pracownika potwierdza, że może wygrać tylko jedna z tych operacji. Przy równoczesnym dodawaniu dwóch osób w trybie samodzielnym powstaje dokładnie jedna kartoteka.

Nieobecność, wyłączony dzień w grafiku lub ukrycie w kalendarzu nie są usunięciem osoby z zespołu i nie zmieniają trwale limitu widełek. R03 osobno sprawdza dostępność wymaganego zespołu w konkretnym terminie.

## Istniejące zamówienia i dane

Nowa migracja `apps/api/src/database/migrations/20261027-provider-staffing-limit.sql` dodaje sposób pracy, opcjonalną deklarację i wersję ustawień. Istniejące konta zachowują tryb zespołowy z limitem liczonym z kartotek; tryb samodzielny wybiera się jawnie. Sposób pracy jest oddzielny od formy prawnej działalności.

Migrację zastosowano lokalnie dwukrotnie. Kontrola liczby i sumy kontrolnej danych wszystkich 7 istniejących zamówień potwierdziła brak zmian (`tmp/r04-migration.log`). Nie zmieniano ich czasu, ceny, obsady ani terminów. Również test zamówienia na 3 osoby zachował jego dane po obniżeniu widełek oferty do 1 i późniejszym zmniejszeniu zespołu.

Aktualizację należy zastosować na każdym pozostałym środowisku przed uruchomieniem tej wersji, również przy synchronizacji schematu. Nie wykonano wdrożenia na serwer zewnętrzny.

## Weryfikacja

- 107/107 testów rezerwacji, obsady, limitów, uprawnień, wykonawcy, analiz i przekładania terminów — zaliczone (`tmp/r04-all-tests.log`).
- Produkcyjne kompilacje API, panelu wykonawcy i strony klienta — zaliczone.
- `scripts/verify-staffing-limit.cjs`: rzeczywista baza, API i przeglądarka — zaliczony (`tmp/r04-integration.log`). Sprawdza domyślny szkic, brak publikacji bez osoby, tryb samodzielny, ograniczenie deklaracją i kartotekami, równoczesne zapisy, ochronę wcześniejszych rezerwacji, archiwizację i przywracanie, stare wersje ustawień, role, ukrycie błędnych profili w API i odczycie z bazy, przyciski widełek i zapis deklaracji z formularza. Widoki telefonu i komputera sprawdzono bez błędów JavaScript.
- Regresja R03 z rzeczywistą bazą — zaliczona (`tmp/r04-r03-regression.log`).
- Regresja publikacji, migracji i projektów R01/R02 — zaliczona (`tmp/r04-publication.log`).
- Dane wszystkich prób były tymczasowe i zostały usunięte. Nie zmieniano ustawień rzeczywistych firm w celu przeprowadzenia testu.

## Dalsze punkty

R05 w zakresie zapisu i blokowania nieobecności został obsłużony razem z R03. Aktualizacja z 27 października realizuje R06: pełny edytor projektu, sesji i bilansu roboczogodzin opisuje [raport R06](r06-edytor-projektu-2026-10-27.md). Następny niezamknięty punkt to R07 — wcześniejsze zakończenie projektu. Pozostałe ograniczenia raportu R03 obowiązują z uwzględnieniem aktualizacji R06.
