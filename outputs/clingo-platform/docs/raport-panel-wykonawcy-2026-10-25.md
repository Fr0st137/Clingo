# Raport weryfikacji panelu wykonawcy Clingo

Data: 25.10.2026. Zakres: bieżąca lokalna wersja projektu `outputs/clingo-platform`.

## Ocena ogólna

**Panel nie jest jeszcze gotowy do pełnej obsługi działalności.** Działa podstawowy zapis danych, pracowników, klientów, usług i zleceń, a także publikowanie oferty i przekazywanie rezerwacji klienta do wykonawcy. Największe braki dotyczą dostępności pracowników, nieobecności, komunikacji, rozliczeń i spójności danych między modułami.

Wygląd gotowego ekranu nie oznacza, że jego działania są zaimplementowane. Czat, płatności i osobna strona ustawień kalendarza nadal zawierają podgląd projektu. Inne ekrany zapisują dane, ale część ustawień nie wpływa jeszcze na rezerwacje klientów.

Priorytety:

- **P1 — przed uruchomieniem pełnej obsługi:** błędy lub braki wpływające na możliwość realizacji zamówień, komunikację, ceny i wiarygodność danych.
- **P2 — istotne uzupełnienie:** niedokończone procesy i błędne zachowanie części interfejsu.
- **P3 — dalsze dopracowanie:** ograniczenia wygody i prezentacji.

„Brak” oznacza niedokończoną funkcję. „Błąd” oznacza, że istniejące elementy nie współpracują zgodnie z oczekiwanym procesem. Poniżej wskazano również ograniczenia, które interfejs już otwarcie komunikuje.

## 1. Najważniejsze braki i błędy

| ID | Priorytet | Obszar i status | Co obecnie nie działa / skutek |
|---|---|---|---|
| W01 | P1 | Nieobecności — brak zapisu | Poprawnie wypełniony formularz zawsze wyświetla: „Zapisywanie nieobecności nie jest jeszcze dostępne. Termin nie został zablokowany.” Nie wysyła zapisu do serwera; API nie ma operacji tworzenia nieobecności. |
| W02 | P1 | Dostępność — brak integracji | Zapisane nieobecności i tygodniowe grafiki pracowników nie są uwzględniane przy wyznaczaniu terminów rezerwacji klienta. Nieobecność nie blokuje terminu ani nie ukrywa ogłoszenia, mimo opisu w formularzu. |
| W03 | P1 | Obsada rezerwacji — brak | Rezerwacje pochodzące od klientów mają `employeeId: null`. Przycisk dodania pracownika w ich szczegółach jest wyłączony. Nie można przydzielić zespołu do takiej realizacji. Ręczne zlecenie obsługuje pojedyncze przypisanie pracownika. |
| W04 | P1 | Pojemność zespołu — ograniczenie | Dostępność rezerwacji blokowana jest na poziomie całej działalności. Jedno zajęte zlecenie może blokować równoległe rezerwacje, mimo wolnych innych pracowników. Konfiguracja liczby pracowników dla powierzchni nie steruje pełnym przydziałem zespołu; w rezerwacjach wielosesyjnych występuje uproszczone wyliczenie liczby osób. |
| W05 | P1 | Czat — brak | Rozmowy i wiadomości są przykładowe. Nie ma rzeczywistego pola wpisywania, wysyłania, załączników ani wymiany wiadomości z klientem. Przycisk wiadomości w kartotece klienta jest nieaktywny. |
| W06 | P1 | Powiadomienia — brak wysyłki | Preferencje zapisują się, ale wysyłka e-mail/SMS nie działa. Ikona powiadomień w nagłówku nie otwiera centrum powiadomień. Komunikat przy zmianie terminu/odwołaniu nie jest równoznaczny z wysłaniem wiadomości: dla ręcznego zlecenia trafia do notatki, a dla rezerwacji klienta do danych zamówienia. |
| W07 | P1 | Płatności i abonament — podgląd | Plan, karta i lista faktur zawierają przykładowe dane. „Zmień plan”, anulowanie członkostwa i pobieranie faktury nie mają podłączonych operacji. Okno zmiany karty otwiera się, ale „Zapisz” jest wyłączony. Brak podłączonego procesu płatności, subskrypcji i wystawiania faktur. Prezentowane limity planu nie stanowią działającego systemu uprawnień. |
| W08 | P1 | Opinie klient → wykonawca — błąd integracji | Klient zapisuje opinię w `customer_reviews`, a panel wykonawcy odczytuje `provider_reviews`. W sprawdzonym przepływie zapisu brak synchronizacji tych źródeł. Nowa opinia klienta może być dostępna publicznie, a nie pojawić się w zakładce „Opinie” wykonawcy. |
| W09 | P1 | Analizy — błędne liczenie sesji | Jedna rezerwacja z dwiema sesjami jest liczona jako dwa wykonane zamówienia; ten sam dodatek jest liczony dwukrotnie. Taki klient może też zostać uznany za ponownie zamawiającego na podstawie sesji jednej rezerwacji. Potwierdzone uruchomieniem obliczeń na danych kontrolnych. |
| W10 | P1 | Analizy — niespójne identyfikatory | Ręczne zlecenia i rezerwacje klientów używają różnych identyfikatorów usługi i klienta. Ta sama usługa może rozdzielić się na dwa wiersze, a ta sama osoba na dwóch klientów. W próbie: ten sam e-mail w dwóch źródłach dał 2 aktywnych klientów i 0 powracających. |
| W11 | P1 | Analizy pracowników — niepełne wyniki | Rezerwacje klienta bez przypisanej osoby nie zwiększają wykorzystania grafiku pracownika. „Bez przypisania” może pojawić się jako dodatkowy wiersz w zestawieniu i zwiększać licznik pracowników. Wskaźniki nie pokazują jeszcze pełnego obciążenia firmy. |
| W12 | P1 | Koszt i obszar dojazdu — brak integracji | Stawka za kilometr i promień zasięgu zapisują się, ale nie tworzą wyceny trasy ani obszaru dostępności po odległości. Rezerwacja opiera obszar na miejscowości; zapisany promień nie rozszerza go na sąsiednie miejscowości. Kwota dojazdu nie jest naliczana z faktycznego dystansu. |
| W13 | P2 | Ręczne zamówienie — utrata struktury danych | Dodatki, powierzchnia, rabat i dane do faktury są składane do tekstowej notatki. Całkowita cena pozostaje, ale dane nie są zapisywane jako oddzielne pozycje dodatków/podsumowania/faktury. Szczegóły i analizy nie mogą ich potem poprawnie odczytać jako danych strukturalnych. |
| W14 | P2 | Zespół — brak kont pracowników | Można utworzyć kartotekę pracownika, lecz nie jego dostęp do panelu. Zaproszenie, tworzenie konta i wybór poziomu uprawnień są niedostępne. Serwerowe kontrole ról istnieją, ale nie zamykają tego procesu w interfejsie. |
| W15 | P2 | Zamówienia wielosesyjne — częściowe wdrożenie | Można odczytywać i obsługiwać istniejące zgłoszenia, ale przycisk tworzenia zamówienia wielosesyjnego przez wykonawcę jest wyłączony. Dedykowany adres szczegółów przekierowuje do listy. |
| W16 | P2 | Kalendarz — niewidoczne godziny | Widok tygodniowy obcina zdarzenia do 08:00–20:00, dzienny do 08:00–21:00. Zlecenia poza tym zakresem mogą nie być widoczne na osi, choć istnieją w danych i w widoku miesiąca. |
| W17 | P2 | Kolory kalendarza — błąd dla rezerwacji | Kolory są mapowane po identyfikatorze ręcznej oferty, a rezerwacje klienta używają identyfikatora `profile:…`. Ustawiony kolor nie obejmuje tych rezerwacji tą samą ścieżką. |
| W18 | P2 | Ustawienia kalendarza — dwie niespójne ścieżki | Menu trzech kropek zapisuje preferencje tylko w bieżącej przeglądarce. Osobna strona Ustawienia → Kalendarz nadal jest podglądem z nieaktywnym wyborem widoku i kolorów. Brak wspólnego zapisu ustawień na koncie między urządzeniami. |
| W19 | P2 | Zdjęcia wymagane od klienta — brak wymuszenia | Przełącznik usługi opisuje obowiązkowe zdjęcia podczas zamawiania. Publikacja przekłada go jedynie na tekstową prośbę o późniejsze przekazanie zdjęć. Nie ma odpowiadającego temu obowiązkowego załącznika przy rezerwacji. |
| W20 | P2 | Cykliczność — ograniczona funkcja | Włączenie cykliczności daje opcję częstotliwości i rabat na bieżącą wizytę. Nie tworzy automatycznie kolejnych terminów. Publikowana treść informuje, że następne wizyty trzeba rezerwować osobno. |
| W21 | P2 | Szczegóły zlecenia — niepełne | Brak pełnej historii zmian i dodawania zdjęć. Dla rezerwacji klienta brakuje również prywatnych notatek wykonawcy. Ręczne notatki tekstowe działają. |
| W22 | P2 | Ustawienia konta — niepełne | Brak zmiany e-maila do logowania i jego weryfikacji oraz usunięcia konta. Brak interfejsu odzyskiwania zapomnianego hasła w panelu wykonawcy. Zmiana hasła po zalogowaniu działa. |
| W23 | P2 | Wyszukiwanie globalne — brak | „Szukaj” w nagłówku jest elementem wizualnym, bez pola i działania wyszukującego. Lokalne wyszukiwarki na listach są oddzielnymi funkcjami. |
| W24 | P2 | Dane do faktur — podgląd | Osobna strona danych fakturowych ma przykładowe wartości i wyłączony zapis. Dane faktury przekazane przy zamówieniu nie oznaczają wystawienia dokumentu księgowego. |
| W25 | P3 | Grafiki — brak części działań | „Skopiuj na inne dni” i „Nieobecność” w grafikach są wyłączone. Działa stały tygodniowy wzorzec; brak pełnej obsługi wyjątków na konkretne daty. |
| W26 | P3 | Zdjęcia pracowników — brak | Dodawanie fotografii jest wyłączone. Wyświetlane są inicjały lub grafika zastępcza. |
| W27 | P3 | Standardy usługi — niewłaściwa treść celu | Link prowadzi do `/standardy-uslug`, gdzie renderowane są karty opinii i opis sprawdzania ocen, a nie dokument standardów akceptowanych przy publikacji. |

## 2. Co jest już wprowadzone i przeszło sprawdzenia

| Moduł | Potwierdzony zakres |
|---|---|
| Konto i dostęp | Rejestracja/logowanie, tworzenie działalności, kontrola przynależności do konta i ról, wylogowanie. Testy sprawdzają również odmowę dostępu do cudzych danych. |
| Pracownicy | Dodawanie, edycja, usuwanie kartoteki i zapis stałego grafiku tygodniowego. To nie jest jeszcze konto pracownika z zaproszeniem. |
| Klienci | Obsługa kartoteki, danych kontaktowych, adresów i notatek; API ma kontrolę konta i wersji zapisu. |
| Usługi | Zapis szkicu i konfiguracji, obsługa mediów, publikacja w katalogu klienta, aktualizacja i wycofanie. Integracyjnie sprawdzono wycenę powierzchniową i przekazanie rezerwacji do panelu. |
| Zlecenia | API ręcznych zleceń, kontrola nakładania przypisań, zmiany statusów i wersjonowanie danych. Przekazywanie rezerwacji klienta do zleceń wykonawcy działa. Zastrzeżenia dotyczące obsady i danych dodatkowych opisano wyżej. |
| Nieobecności | Odczyt istniejących wpisów, lista aktywnych i historia, oznaczanie anulowania/przywrócenia. Testowe wpisy w bazie nie dowodzą działania formularza tworzenia ani blokady dostępności. |
| Ustawienia | Zapis podstawowych danych działalności, lokalizacji i preferencji powiadomień, zmiana hasła po zalogowaniu, ograniczony eksport danych. |
| Analizy | Pobieranie danych i obliczenia okresów, sum, filtrów oraz eksportu mają testy. Nie usuwa to problemów między źródłami i sesjami wskazanych w W09–W11. |

Eksport działalności obejmuje dane firmy, preferencje, lokalizację i pracowników z grafikami. **Nie jest pełną kopią całego konta:** nie obejmuje wszystkich zleceń, klientów, usług, opinii i nieobecności.

Zgłoszenie opinii zapisuje znacznik zgłoszenia. Nie potwierdzono pełnego procesu moderacji po stronie obsługi serwisu. Oceny nie są powiązane z konkretnymi pracownikami, więc nie należy traktować tabeli pracowników jako wdrożonego rankingu ich ocen.

Kwoty w analizach wynikają z wartości zleceń. **Nie potwierdzają otrzymania płatności.** Porównania wykorzystania grafików używają bieżącego wzorca tygodniowego, bez historycznej wersji grafiku dla każdego porównywanego okresu.

## 3. Jak sprawdzono

1. Przejrzano trasy i komponenty panelu oraz powiązane operacje serwera, modele danych i przepływ rezerwacji klienta.
2. Uruchomiono zestaw podstawowych testów panelu: **52/52 zaliczone**; obejmuje API pracowników, ustawień, klientów, usług, zleceń, opinii, zgłoszeń wielosesyjnych i pośrednictwo żądań. Kompilacja API w tym przebiegu zakończyła się powodzeniem.
3. Uruchomiono dodatkowe testy analiz, mediów usług, pojedynczego zamówienia i wyszukiwania: **17/17 zaliczone**. Łącznie **69 testów, 0 niepowodzeń** w tych dwóch zestawach.
4. Sprawdzono integracyjnie prawdziwe API i PostgreSQL na danych tymczasowych: logowanie, tworzenie działalności, role, izolację danych, równoległe zmiany, trwałość zapisu, ustawienia, eksport, zmianę hasła i wylogowanie — **zaliczone**.
5. Sprawdzono drugi proces integracyjny: szkic → publikacja → katalog → wycena → rezerwacja klienta → zlecenie wykonawcy → aktualizacja ceny → wycofanie → anulowanie → ponowna publikacja, wraz z konfliktami i kontrolą właściciela — **zaliczone**.
6. W przeglądarce sprawdzono cztery widoki na kontrolowanych odpowiedziach API: kalendarz/formularz nieobecności, czat, płatności i ustawienia kalendarza. Potwierdzono W01, W05, W07, W18 i W23. W sprawdzonym przebiegu nie wystąpiły błędy JavaScript. To sprawdzenie interfejsu, nie test danych zalogowanego rzeczywistego konta.
7. Uruchomiono dodatkową próbę obliczeń analiz. Dla jednej rezerwacji z dwiema sesjami otrzymano: 2 zamówienia, 2 zamówienia z tym samym dodatkiem, 1 ponownie zamawiającego klienta i 1 wiersz pracownika mimo braku pracowników. Dla jednego e-maila i usługi w dwóch źródłach: 2 klientów i 2 wiersze usług. Potwierdza to W09–W11.
8. Kompilacja produkcyjna panelu wykonawcy — **zaliczona**, wraz ze sprawdzeniem typów i wygenerowaniem stron. Pierwsza próba została zatrzymana przez uprawnienia środowiska do katalogu wynikowego; ponowienie z odpowiednim dostępem zakończyło się powodzeniem. Nie jest to wykryty błąd aplikacji.

Logi sprawdzeń znajdują się w `tmp/provider-audit-tests.log`, `tmp/provider-audit-extra-tests.log`, `tmp/provider-audit-integration.log`, `tmp/provider-audit-publication.log` oraz `tmp/provider-audit-ui.log`. Próba analiz: `tmp/provider-audit-probes.cjs`. Wynik kompilacji panelu: `tmp/provider-audit-build.log`.

## 4. Główne miejsca w kodzie potwierdzające ustalenia

Ścieżki względem katalogu `outputs/clingo-platform`:

| Ustalenia | Miejsce |
|---|---|
| W01–W04 | `apps/provider/components/provider-absence-form.tsx:34`, `apps/api/src/provider/provider-absences.controller.ts`, `apps/api/src/dashboard/booking-bridge.ts:36`, `apps/api/src/dashboard/booking.service.ts`, `apps/provider/components/provider-order-details.tsx:101` |
| W05–W07, W23–W24 | `apps/provider/components/provider-chat-page.tsx:5`, `provider-shell.tsx:123`, `provider-settings-notifications-page.tsx:36`, `provider-payment-methods-page.tsx:39`, `provider-change-card-dialog.tsx:35`, `provider-invoice-details-page.tsx` |
| W08 | `apps/api/src/provider/provider-reviews.service.ts:25`, `apps/api/src/dashboard/customer.service.ts:100` |
| W09–W11 | `apps/provider/lib/provider-analytics.ts`, `apps/provider/lib/provider-analytics-dashboard.ts:62`, `apps/api/src/dashboard/booking-bridge.ts:51` |
| W12, W19–W20 | `apps/api/src/provider/provider-offer-publication.ts:30`, `apps/api/src/dashboard/booking.ts`, `apps/provider/components/provider-service-config-page.tsx:211`, `provider-settings-location-page.tsx:28` |
| W13, W15, W21 | `apps/provider/components/provider-single-order-editor.tsx:85`, `provider-order-type-dialog.tsx:12`, `provider-order-details.tsx:112`, `apps/provider/app/orders/multi-session/details/page.tsx` |
| W14, W22, W25–W26 | `apps/provider/components/provider-employee-form-page.tsx:68`, `provider-settings-data-page.tsx:56`, `provider-work-schedules-page.tsx:42`, `provider-login-page.tsx` |
| W16–W18 | `apps/provider/components/provider-jobs-page.tsx:83`, `provider-jobs-page.tsx:120`, `provider-jobs-page.tsx:171`, `provider-settings-calendar-page.tsx:42` |
| W27 | `apps/provider/components/provider-service-config-page.tsx:248`, `apps/web/app/standardy-uslug/page.tsx` |

## 5. Zalecana kolejność dalszych prac

1. Połączyć grafiki, nieobecności, obsadę i dostępność rezerwacji w jeden proces. Dodać zapis nieobecności, przydział pracowników i kontrolę realnej liczby wolnych osób.
2. Ujednolicić identyfikatory klientów i usług oraz rozróżnić zamówienie od jego sesji. Poprawić analizy i przepływ opinii klient → wykonawca.
3. Uruchomić komunikację: rzeczywisty czat, centrum powiadomień, e-mail/SMS oraz jasny status dostarczenia wiadomości o zmianach zlecenia.
4. Dokończyć rozliczenia i zasady oferty: naliczanie dojazdu, zasięg, wymagane zdjęcia, abonament, faktury i ewentualne płatności za realizacje.
5. Uzupełnić konta pracowników, wielosesyjność, szczegóły zleceń i ustawienia; potem przeprowadzić całościowy test na osobnym koncie testowym oraz porównanie ekranów z Figmą.

## Ograniczenia raportu

To audyt lokalnego projektu, a nie potwierdzenie stanu serwisu wdrożonego na zewnętrznym serwerze. Nie przeprowadzono kompletnego porównania wszystkich ekranów z Figmą ani pełnego audytu bezpieczeństwa, wydajności i urządzeń mobilnych. Nie testowano rzeczywistej wysyłki ani obciążeń kart; odpowiednie integracje nie są ukończone. Część ustaleń pochodzi z analizy kodu, co zaznaczono przez osobne opisanie zakresu testów uruchomieniowych.

W ramach tego audytu nie naprawiano aplikacji i nie zmieniano danych konta `kounterstrike6@gmail.com` / `testFirma`. Próby integracyjne używały danych tymczasowych z własnym sprzątaniem.
