# R03 — dostępność i rzeczywista obsada

Poprawka łączy publiczne rezerwacje ze wspólną dostępnością pracowników. Dołączono bezpośrednio powiązany zapis i blokadę nieobecności R05 oraz część reguł wyboru obsady R26. R04 pozostaje kolejnym osobnym punktem.

## Zmiany w działaniu

- Dostępność uwzględnia przypisany rodzaj usługi, włączone dni i godziny grafiku, nieobecności, pozostałe rezerwacje i ręczne zlecenia. Widoczność pracownika w kalendarzu nie jest traktowana jako jego dostępność do pracy.
- Firma nie jest już blokowana przez każde zlecenie. Przykład: dla trzech dostępnych osób jedna rezerwacja na dwie osoby i druga na jedną mogą odbywać się równocześnie. Kolejna rezerwacja w tym czasie zostaje odrzucona.
- Termin musi mieć wymaganą obsadę przez cały czas sesji. System nie skleja pozornej ciągłości z różnych, niepokrywających się zmian. Dla kolejnych sesji może wybrać inne osoby.
- Publiczne ogłoszenie i wycena uwzględniają maksymalne ciągłe okno dla konkretnej liczby osób. Krótsze zmiany mogą więc przełączyć usługę na projekt. Godziny spoza 08–20 są dostępne według grafiku, a wybór godzin klienta potrafi je pokazać.
- Podczas potwierdzenia serwer ponownie dobiera i zapisuje konkretne osoby; nie ufa identyfikatorom ani liczbie osób przesłanym przez klienta. Jeden projekt ma kolejne, nienakładające się sesje. Różne zamówienia mogą korzystać z odrębnych osób równocześnie.
- Zapis rezerwacji, przydziałów, nieobecności i zmian pracowników korzysta ze wspólnej blokady konta w bazie. Równoczesne próby zajęcia ostatnich wolnych osób nie tworzą podwójnych przydziałów.
- Zajętość jest wspólna dla różnych ofert tej samej firmy. Bufory uwzględniają większą wartość obu sąsiadujących usług; ręczne zlecenie przypisane do osoby również sprawdza jej grafik, usługę i nieobecności.
- W szczegółach rezerwacji wykonawca widzi pełną obsadę sesji. Może zaznaczyć dostępne osoby i zapisać zmianę; co najmniej jedna osoba jest obowiązkowa. Zmniejszenie obsady względem wyceny wymaga osobnego potwierdzenia i nie skraca czasu ani ceny usługi. Nieaktywna lub starsza wersja rezerwacji nie może nadpisać aktualnej.
- Filtr pracowników obejmuje każdego członka zespołu sesji, a obciążenie w analizach uwzględnia wszystkie przypisane osoby.
- Przełożenie terminu ponownie sprawdza obsadę i może wybrać inne dostępne osoby. Nowe rezerwacje zachowują rodzaj usługi w swoich danych, aby późniejsza zmiana kategorii oferty nie zmieniała reguł ich obsady.
- Nie można usunąć pracownika mającego aktywne przypisane terminy. Najpierw trzeba zmienić obsadę lub odwołać te terminy.
- Klient widzi liczbę osób; nazwiska i identyfikatory obsady są dostępne wyłącznie w uprawnionym panelu wykonawcy. Lista sesji w odpowiedzi dla klienta zawiera wyłącznie terminy i liczbę osób.

## Nieobecności R05

Formularz zapisuje początek, koniec, powód i wybranych pracowników. Powody obejmują urlop na żądanie, wypoczynkowy, szkolenie, L4 i inne. Zapis natychmiast blokuje nowe rezerwacje tych osób w podanym czasie, a anulowanie zwalnia dostępność. Działają numery i lista zapisanych nieobecności.

Nieobecność nie zmienia statusu, terminu ani obsady istniejących zleceń. Takie konflikty wymagają ręcznej obsługi przez wykonawcę; formularz przedstawia tę informację. Nieobecność osoby z innej działalności i nieistniejące daty są odrzucane.

## Istniejące dane i uruchomienie

Nie przypisywano automatycznie pracowników do historycznych zamówień. Rezerwacje firmy i ręczne zlecenia bez obsady zachowują ostrożną blokadę całego zespołu, dopóki wykonawca nie uzupełni obsady lub nie zmieni terminu. Samodzielne, starsze profile katalogowe bez powiązanego konta pozostają przy wcześniejszym modelu kalendarza.

Na koncie muszą istnieć rzeczywiste kartoteki pracowników, przypisane usługi i włączone zmiany. Brak takiej obsady oznacza brak dostępnych terminów. Nie tworzono fikcyjnych pracowników ani nie zmieniano grafików rzeczywistych kont.

Obsada jest zapisywana w istniejącym `orders.selected_options`, bez przebudowy tabeli zamówień. Każda baza musi mieć zastosowaną wcześniejszą migrację `20261025-provider-absences.sql`; synchronizacja schematu nie tworzy tej tabeli. Lokalna baza już ją posiada.

## Weryfikacja

- 30/30 testów rezerwacji, wyceny, R01/R02 i dostępności pracowników.
- 53/53 testy modułów wykonawcy, w tym uprawnienia i zabezpieczenia nowych operacji.
- 21/21 testów wyboru wariantu, analiz i przekładania terminów. Razem 104 testy, bez błędów (`tmp/r03-all-tests.log`).
- Produkcyjne kompilacje API, klienta i panelu wykonawcy — zaliczone.
- `verify-staffing.cjs`: rzeczywista baza i API; równoległe przydziały, wyścig o ostatnie osoby, kwalifikacje, uprawnienia, wersje danych, potwierdzenie mniejszej obsady, nieobecności nakładające się na istniejące zlecenia, anulowanie blokady, sesje projektu, przełożenie do innej osoby, terminy od 06:00, krótsze zmiany, prywatność danych, blokada usunięcia pracownika, kolizje z ręcznymi zleceniami. Wynik: `tmp/r03-integration.log`.
- `verify-multi-session-booking.cjs`: pełny test przeglądarkowy zamówienia, zmiany pracownika w sesji oraz zapisu i wyświetlenia nieobecności. Brak błędów JavaScript. Wynik: `tmp/r02-ui.log`, zrzuty: `tmp/r03-provider-staffing.png`, `tmp/r03-absence-form.png`, `tmp/r03-absence-manager.png`.
- `verify-publication.cjs`: regresja publikacji, migracji i rezerwacji R01/R02 z rzeczywistymi pracownikami. Wynik: `tmp/r03-publication.log`.
- Wszystkie konta, oferty, zlecenia i nieobecności użyte w tych próbach były tymczasowe i zostały usunięte.

## Pozostałe punkty

W momencie zakończenia R03 konfiguracja widełek wymagała jeszcze ograniczenia stanem zespołu. Aktualizacja z 27 października realizuje R04: wybór sposobu pracy, deklarację obsady i limity powiązane z kartotekami opisano w `r04-limit-obsady-2026-10-27.md`.

Aktualizacja R06 z 27 października dodaje pełny edytor projektu, bilans roboczogodzin, wiele osób oraz dodawanie i usuwanie sesji; obejmuje również wcześniejsze zgłoszenia wielosesyjne. Szczegóły opisuje [raport R06](r06-edytor-projektu-2026-10-27.md). Wcześniejsze zakończenie całego projektu pozostaje punktem R07. Samodzielne ręczne zlecenia nadal mają pojedyncze przypisanie i dopuszczają brak osoby; pełna reguła R26 pozostaje częściowa. Nie zmieniano definicji finansowych wskaźników analiz ani innych ustaleń historycznego audytu.
