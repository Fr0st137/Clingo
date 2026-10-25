# Panel wykonawcy Clingo — raport zgodności z zakresem

Data: 25.10.2026. Weryfikowana wersja: bieżący lokalny projekt `outputs/clingo-platform`.

## 1. Podstawa i najważniejszy wniosek

Porównano aplikację i poprzedni raport z dwoma dokumentami z głównego folderu:

- **Z — „Zakres Clingo.pdf”, 39 stron:** mechaniki systemowe na s. 2–10 oraz perspektywa wykonawcy na s. 23–39; dodatkowo wymagania profilu i zamawiania na s. 14–17.
- **O — „Zamówienia Clingo.pdf”, 9 stron:** szczegółowy model zamówień zwykłych i wielosesyjnych.

Numery stron oznaczają fizyczne strony plików PDF, liczone od 1. Dokumenty traktowano łącznie. Nie założono, że jeden automatycznie unieważnia drugi; sprzeczności i niedookreślone zapisy wskazano osobno.

**Podstawowa obsługa danych jest wdrożona, ale kluczowy model realizacji usług opisany w zakresie nie jest jeszcze zrealizowany w całości.** Największa różnica dotyczy łańcucha: widełki metrażu → liczba osób → czas realizacji → dostępność pracowników → sesje → rozliczenie. Poszczególne ekrany istnieją, lecz nie tworzą jeszcze tego procesu.

To raport technicznej zgodności funkcji z dostarczonym opisem, a nie ocena wykonania umowy. Nie podaję procentu gotowości: wymagania mają różną wagę, część pozostaje niedoprecyzowana.

## 2. Korekty i doprecyzowania poprzedniego raportu

1. **Brak płatności online klient → wykonawca jest zgodny z zakresem.** Z s. 4, 10, 17 i 24 oraz O s. 1 jednoznacznie wynika rozliczenie bezpośrednio między stronami. Nie należy dodawać bramki płatności za usługę tylko w celu zamknięcia tego zakresu. Wymagane są natomiast płatności abonamentowe wykonawca → Clingo oraz faktury VAT/Pro forma wystawiane przez wykonawcę do zleceń. To dwa oddzielne procesy.
2. **Nie można uznać automatycznego generowania kolejnych wizyt cyklicznych za jednoznacznie wymagane.** Z s. 25–26 wymaga częstotliwości: jednorazowo, miesięcznie, co dwa tygodnie, co tydzień, z odrębnymi rabatami. Nie opisuje kompletnego algorytmu powielania przyszłych rezerwacji. Pewną niezgodnością jest brak wariantu miesięcznego i dwutygodniowego oraz osobnych rabatów. Automatyczne tworzenie kolejnych wizyt wymaga ustalenia.
3. **Szczegółowe wskaźniki analiz nie są zdefiniowane w PDF-ie.** Z s. 37 pozostawia je do opisania na podstawie Figmy. Błędy obliczeń wskazane wcześniej pozostają błędami jakości danych, lecz nie są dowodem niedotrzymania konkretnego wzoru KPI z tego PDF-a. Nie wykonywano teraz nowego porównania całego ekranu z Figmą.
4. **Globalna wyszukiwarka i synchronizacja kolorów między urządzeniami nie są jednoznacznymi wymaganiami tego PDF-a.** Nieaktywna wyszukiwarka nadal jest niedziałającym elementem interfejsu, ale trzeba oddzielić to od braku funkcji wymaganej zakresem. PDF wymaga natomiast wyszukiwarek w konkretnych listach oraz ustawiania dni i godzin dostępności firmy.
5. **Zdjęcia w notatkach zlecenia i odzyskiwanie hasła wykonawcy nie mają osobnego jednoznacznego opisu w części wykonawcy.** Prywatne notatki i historia zmian są wymagane. Zdjęcia obszaru usługi przy zamawianiu mycia ciśnieniowego i malowania są opisane wprost na Z s. 16 — to inna funkcja niż zdjęcia dodawane później przez wykonawcę.
6. **Samo wyłączenie ręcznego tworzenia projektu wielosesyjnego nie wyczerpuje problemu.** Dokument wyraźnie wymaga automatycznej klasyfikacji i planowania projektu oraz jego późniejszej edycji. Obecnie istnieją lista zgłoszeń, akceptacja/odrzucenie i odnośniki do sesji publicznych rezerwacji, ale nie pełny edytor projektu. Publiczne rezerwacje wielosesyjne są widoczne na osobnej części listy; nie należy twierdzić, że nie są wyświetlane w ogóle.

## 3. Najistotniejsze potwierdzone rozbieżności

Statusy: **brak** — proces niedostępny; **częściowo** — działa ograniczony zakres; **inaczej** — istniejące działanie różni się od opisu. P1 oznacza problem istotny przed odbiorem podstawowego procesu realizacji usług; P2 — istotne uzupełnienie; P3 — dopracowanie.

| ID | Priorytet | Zakres | Stan aplikacji i skutek |
|---|---|---|---|
| R01 | P1 | Czas zależy od metrażu, wydajności jednej osoby i obsady z widełek. Z s. 2–5, O s. 1–3. | **Inaczej.** Publiczna wycena czasu nie dzieli czasu przez liczbę osób z widełek. Próba: 100 m², 3 h jednej osoby, 2 osoby w przedziale — zakres daje 90 min, aplikacja 180 min. |
| R02 | P1 | Zbyt długa realizacja przechodzi w projekt wielosesyjny, zamiast znikać z oferty. Z s. 3–9, O s. 4–6. | **Inaczej.** Publikacja wymusza oznaczenie „Jednosesyjne” i obcina maksymalny metraż do czasu jednej wizyty 12 h. Próba: skonfigurowane maksimum 1000 m² przy 180 min/100 m² staje się publicznie 400 m². Nie uruchamia to automatycznie pełnego projektu wielosesyjnego. |
| R03 | P1 | Dostępność i automatyczny przydział konkretnych wolnych pracowników; możliwość późniejszej zamiany. Z s. 5–8, 35–36; O s. 2–7. | **Brak integracji.** Publiczne rezerwacje mają puste przypisanie osoby. Grafiki i nieobecności nie sterują dostępnością. Nie można przydzielić pracownika do takiej rezerwacji. Zajętość blokuje firmę zamiast wykorzystywać realną liczbę wolnych osób. |
| R04 | P1 | Liczba osób w widełkach nie przekracza zadeklarowanej obsady; jednoosobowa działalność = 1. Z s. 2. | **Brak ograniczenia zależnego od zespołu.** Walidacja konfiguracji przyjmuje 1–50 osób bez sprawdzenia liczby pracowników konta. Model nie rozróżnia odpowiednio konfiguracji działalności jednoosobowej. |
| R05 | P1 | Dodanie nieobecności blokuje dostępność objętych nią pracowników, bez automatycznego anulowania istniejących zleceń. Z s. 28–29 i 36–37. | **Brak.** Formularz nie zapisuje; serwer ma odczyt i anulowanie/przywracanie istniejących wpisów, bez tworzenia. Nawet istniejące wpisy nie blokują nowych rezerwacji. |
| R06 | P1 | Projekt: dodawanie/usuwanie sesji, zmiana obsady i godzin, roboczogodziny, pozostało/wymagane, postęp i ostrzeżenia. Z s. 8–9 i 31–33; O s. 6–8. | **Częściowo.** Są listy i sesje oraz niektóre operacje statusów/przełożenia. Brakuje pełnego edytora projektu i jego sesji, wielu osób w sesji oraz bilansu roboczogodzin i potwierdzania niedoboru/nadmiaru. |
| R07 | P1 | Wykonawca może zakończyć projekt i zwolnić przyszłe sesje. Z s. 9, 32; O s. 8. | **Inaczej.** API rezerwacji pozwala zakończyć ją dopiero po upływie ostatniego zaplanowanego terminu. Próba potwierdziła odrzucenie wcześniejszego zakończenia. Uniemożliwia to opisane wcześniejsze zakończenie projektu i zwolnienie przyszłych terminów. |
| R08 | P1 | Kontakt przez czat oraz e-mail/SMS o zmianie, anulowaniu i utworzeniu zlecenia. Z s. 8–9, 30, 33, 38; O s. 6, 8–9. | **Brak dostarczania.** Czat jest przykładowym ekranem. Preferencje powiadomień zapisują się, lecz nie działają wysyłki. Zapis wiadomości w danych zamówienia lub w notatce nie jest wysłaniem e-maila/SMS-a. |
| R09 | P1 | Rozliczenie usługi, rabat, faktura VAT i Pro forma również przed zakończeniem. Z s. 6, 9, 29–32; O s. 3, 8. | **Brak pełnego procesu.** Ręczny formularz wylicza rabat i przyjmuje dane fakturowe, ale zapisuje część szczegółów jako notatkę. Nie wystawia dokumentów. Istniejąca rezerwacja klienta nie ma wymaganej pełnej edycji rozliczenia. |
| R10 | P1 | Abonament wykonawcy: wybór planu, płatność, odnawianie, anulowanie/wznowienie, faktury i status nieaktywnego konta. Z s. 10–11, 23–24, 38. | **Brak.** Ekran planu i karty jest podglądem z przykładowymi wartościami. Nie ma pełnego cyklu członkostwa ani egzekwowania uprawnień, limitów i podbić planu. |
| R11 | P1 | Dojazd według stawki/km i rzeczywisty zasięg obsługi. Z s. 14, 23–27, 38. | **Częściowo/inaczej.** Pola zapisują się, lecz wycena nie liczy dystansu. Dostępność obszaru opiera się na miejscowości. Dodatkowo promień jest ograniczony do 100 km, podczas gdy plany w PDF-ie opisują również 200 i 300 km. |
| R12 | P1 | Opinie z wykonanych usług dostępne w panelu wykonawcy. Z s. 14–15, 37. | **Błąd przepływu danych.** Opinie klienta i opinie panelu wykonawcy są zapisywane/odczytywane z różnych tabel bez synchronizacji w sprawdzonym procesie. Same filtry opinii nie rozwiązują braku rzeczywistych ocen. |

### Dalsze wymagania — konfiguracja i obsługa

| ID | Priorytet | Wymaganie i źródło | Weryfikacja |
|---|---|---|---|
| R13 | P2 | Rejestracja firmy z danymi administracyjnymi i NIP-em, potwierdzenie hasła, aktywacja linkiem i wznowienie przerwanego procesu. Z s. 23–24. | **Częściowo.** Panel udostępnia uproszczoną rejestrację e-mail/hasło i utworzenie firmy po nazwie. Brakuje opisanego procesu etapowego, aktywacji i kontynuacji kroków. Dane kontaktowe można później częściowo uzupełnić w ustawieniach. |
| R14 | P2 | Profil firmy: zdjęcie oraz konfiguracja podstawowej dostępności dni/godzin. Z s. 24, 38–39. | **Częściowo.** Nazwa i adres są edytowalne. Brak zapisu zdjęcia firmy i konfiguracji godzin firmy sterującej rezerwacjami. Publikacja korzysta z domyślnego rozkładu pracy, nie z kompletnego ustawienia działalności. |
| R15 | P2 | Samouczek po rejestracji. Z s. 39. | **Brak.** Nie ma prowadzenia przez dodanie pierwszego ogłoszenia i wskazania ustawień lokalizacji, godzin, nazwy i zdjęcia firmy. |
| R16 | P2 | Wszystkie podtypy usług, w tym po remoncie, elewacje, dachy i warianty malowania. Z s. 12, 34–35. | **Częściowo.** Model oferty udostępnia cztery kategorie: domy, biura, mycie ciśnieniowe, malowanie. Brak pełnej struktury podtypów. Lista usług przypisywanych pracownikowi obejmuje tylko domy i biura. Dowolny tytuł oferty nie zastępuje identyfikatora podtypu i jego reguł. |
| R17 | P2 | Częstotliwości miesięczna, dwutygodniowa i tygodniowa z osobnymi rabatami. Z s. 15, 25–26; O s. 3. | **Inaczej.** Konfiguracja ma jeden rabat cykliczny; publikacja generuje tylko wariant jednorazowy i tygodniowy. Brak miesięcznego i dwutygodniowego oraz niezależnych stawek rabatu. Automatyczne powtarzanie wizyt pozostaje kwestią do ustalenia. |
| R18 | P2 | W katalogu ogłoszenia dodatki pochodzą z ustalonej listy; własne pozycje wolno dopisać do konkretnego zamówienia. Z s. 6, 10, 25–27, 31–32; O s. 3–4. | **Inaczej.** Edytor ogłoszenia i walidacja dopuszczają własne dodatki. Własna pozycja w zamówieniu jest dopuszczalna i sama w sobie nie jest błędem. Brakuje ograniczenia katalogu według rodzaju usługi. |
| R19 | P2 | Dodatek: nie wykonuje / bezpłatnie / podana cena. Z s. 10. | **Częściowo.** Można usuwać dodatki i ustawiać cenę, lecz cena 0 jest odrzucana. Potwierdzono próbą walidacji. Brak poprawnego wariantu „za darmo”. |
| R20 | P2 | Odkurzacz: dostępność i możliwość naliczenia osobnej opłaty, wybór przez klienta. Z s. 15–16, 25–26. | **Częściowo.** Konfiguracja ma przełącznik informacyjny, ale nie ma osobnej ceny odkurzacza ani pełnego wariantu wyboru i naliczenia w rezerwacji. |
| R21 | P2 | Doświadczenie w latach i opcjonalny opis; prezentacja języków na profilu. Z s. 14, 25–27. | **Brak pełnej konfiguracji.** Edytor nie zapisuje odrębnie lat/opisu doświadczenia. Publikacja zachowuje wcześniejsze dane lub wartość zastępczą. Brak pełnego zarządzania językami wykonawcy dla publicznego profilu. |
| R22 | P2 | Standardy usług i ich akceptacja. Z s. 1, 12, 14, 25–27. | **Częściowo.** Zgoda przed publikacją jest kontrolowana. Link kieruje jednak na stronę renderującą opinie zamiast treści standardu. Dla różnych kategorii nadal występują wspólne teksty dotyczące sprzątania mieszkań. |
| R23 | P2 | Zdjęcia obszaru przy zamawianiu mycia/malowania; wymaganie zdjęć zgodne z ustawieniem. Z s. 16. | **Brak pełnego procesu.** W sprawdzonym zapisie rezerwacji brak załącznika i jego wymuszenia. Przełącznik w panelu publikuje tekstową prośbę o późniejsze uzgodnienie zdjęć. Nie zastępuje to załączenia zdjęcia do zamówienia. |
| R24 | P2 | Edycja powierzchni, pytanie o przeliczenie ceny, zmiana częstotliwości oraz dodawanie dodatków do istniejącej rezerwacji. Z s. 5–6, 30–32; O s. 3. | **Brak dla rezerwacji klienta.** Dostępne operacje to głównie status i przełożenie. Brakuje kompletnej edycji tych parametrów. Ręczny formularz i tekstowa notatka nie zapewniają tej funkcji dla zamówienia ze strony Clingo. |
| R25 | P2 | Niezależna zmiana godziny początku/końca i możliwość zmiany końca rozpoczętej sesji. Z s. 5–9; O s. 3, 7–8. | **Inaczej.** Publiczna rezerwacja może być przełożona z zachowaniem dotychczasowej długości. Serwer zabrania zmiany czasu trwania w tej operacji i blokuje przełożenie już rozpoczętego terminu. Brak oddzielnej ścieżki zmiany końca trwającej sesji. |
| R26 | P2 | Minimum jedna przypisana osoba; dostępni pracownicy do wyboru i ostrzeżenie o zmniejszeniu obsady. Z s. 6, 30, 35; O s. 3, 7. | **Brak pełnej reguły.** Ręczne zlecenie dopuszcza brak osoby i pojedyncze przypisanie. Lista nie realizuje kompletnego filtrowania po grafiku/nieobecności, wymaganej usłudze i zdolności całego zespołu. Działa kontrola części kolizji już zapisanych zleceń. |
| R27 | P2 | Notatki prywatne, pełna historia zmian i przejście do rozmowy z klientem. Z s. 6, 29–33; O s. 3. | **Częściowo.** Ręczna notatka działa. W rezerwacji klienta notatki prywatne są niedostępne; historia ogranicza się do wersji/statusu i wybranych komunikatów. Czat nie realizuje kontaktu. |
| R28 | P2 | Zewnętrzne zlecenie z wyborem, czy blokuje terminy. Z s. 28. | **Inaczej.** Ręczny formularz nie ma takiego wyboru. Zaplanowane zlecenie jest uwzględniane w zajętości firmy dla rezerwacji klientów. |
| R29 | P2 | Projekt po anulowaniu znika z kalendarza i zwalnia dostępność. Z s. 9; O s. 9. | **Częściowo.** Status anulowania zwalnia zajętość rezerwacyjną, ale komponenty głównego kalendarza nadal renderują anulowane wpisy. Jest to inne zachowanie prezentacji niż opisane zniknięcie projektu. |
| R30 | P2 | Zaproszenia, uprawnienia i zdjęcia pracowników. Z s. 34–35. | **Brak.** Działa kartoteka i zapis tygodniowych godzin, lecz zdjęcie i zaproszenie są niedostępne, a wybór roli wyłączony. Zakres dodatkowych poziomów uprawnień sam PDF pozostawia niepełny. |
| R31 | P2 | Grafiki konkretnych dni, kopiowanie, eksport PDF, obsługa nieobecności z grafiku. Z s. 35–37. | **Częściowo/inaczej.** Edytowany jest tygodniowy wzorzec, a nie niezależny wyjątek daty. Kopiowanie i przycisk nieobecności są wyłączone. „Pobierz” tworzy CSV, choć zakres wymaga PDF do dokumentacji. |
| R32 | P2 | Pełna kartoteka klienta: stały rabat, nieobecności klienta, dane do faktury, osobne notatki z tytułem. Z s. 33–34. | **Częściowo.** Kontakt, adres, pojedyncze pole notatki i zlecenia działają. Stały rabat i nieobecności pokazują brak danych; brak ich procesu. Brak osobnych danych fakturowych klienta oraz kolekcji notatek z tytułami. Nieobecność klienta jest innym pojęciem niż urlop pracownika. |
| R33 | P2 | Zmiana i potwierdzenie e-maila/telefonu; usuwanie konta i kopia danych. Z s. 38. | **Częściowo.** Zmiana nazwy, telefonu kontaktowego i hasła działa. Brak potwierdzania telefonu oraz zmiany/potwierdzenia e-maila logowania. Usunięcie konta jest wyłączone. Eksport obejmuje tylko część danych, bez pełnego zbioru zleceń, klientów, usług, opinii i nieobecności. Dokładną zawartość wymaganej „kopii danych” trzeba ustalić. |
| R34 | P2 | Powiadomienia z archiwum, filtrowaniem i archiwizacją. Z s. 37. | **Brak.** Ikona w nagłówku nie otwiera takiego panelu. Preferencje nie zastępują centrum powiadomień. |
| R35 | P3 | Ikona czatu otwiera listę ostatnich rozmów z wyszukiwarką i przejściem do pełnego czatu. Z s. 38. | **Inaczej.** Nagłówek kieruje bezpośrednio do przykładowego pełnego ekranu. Brak wymaganego podglądu ostatnich rozmów i działającej wyszukiwarki rozmów. |
| R36 | P3 | Pomoc: strona wsparcia, e-mail i telefon. Z s. 37. | **Brak pełnego procesu.** Okno pomocy zawiera ogólną instrukcję i przejście do ustawień, bez opisanego wsparcia i danych kontaktowych. Dodatkowe kanały społecznościowe są w dokumencie opcjonalne. |
| R37 | P3 | Informacje na kafelkach kalendarza i podgląd po najechaniu. Z s. 29. | **Częściowo.** Widoki nie prezentują całego wymaganego zestawu w opisany sposób: np. miesiąc ma krótki tytuł zamiast kompletnego podglądu terminu, adresu i dodatków; tydzień nie ma wymaganego podglądu lokalizacji. |
| R38 | P2 | Nieobecności z określonymi powodami, numerami, listą i filtrami. Z s. 36–37. | **Częściowo.** Numer, pracownicy, daty, statusy i filtry istnieją dla zapisanych wpisów; anulowanie jest możliwe. Formularz ma powody Urlop/Choroba/Inne zamiast pełnego zestawu: urlop na żądanie, wypoczynkowy, szkolenie, L4. Brak tworzenia pozostaje zasadniczym problemem R05. |

## 4. Ponowna ocena wszystkich 27 ustaleń z pierwszego raportu

Poniższa tabela odnosi się do identyfikatorów W01–W27 z `raport-panel-wykonawcy-2026-10-25.md`. „Potwierdzone” nie oznacza, że każdą pozycję odtworzono w prawdziwej sesji klienta — sposób sprawdzenia podano w części 7.

| Poprzednie ID | Wynik ponownej oceny | Powiązanie z zakresem / doprecyzowanie |
|---|---|---|
| W01 | Potwierdzone. | R05: tworzenie nieobecności jest wyraźnie wymagane. Ponownie sprawdzono formularz w przeglądarce. |
| W02 | Potwierdzone. | R03/R05: grafiki i nieobecności muszą wpływać na przydział i dostępność. |
| W03 | Potwierdzone. | R03/R26: zakres wymaga automatycznej i ręcznie edytowalnej obsady, również wieloosobowej. |
| W04 | Potwierdzone i rozszerzone. | R01–R04: problem obejmuje także sam wzór czasu, limity publikacji i brak kontroli liczby dostępnych osób. |
| W05 | Potwierdzone. | R08/R35: czat jest wymagany; ekran pozostaje podglądem. Ponownie sprawdzono brak pola wiadomości. |
| W06 | Potwierdzone. | R08/R34: wymagane wysyłki i centrum powiadomień nie są zrealizowane. Nie należy utożsamiać zapisu preferencji z wysyłką. |
| W07 | Potwierdzone z korektą zakresu. | R09/R10: wymagane są subskrypcje wykonawcy i dokumenty rozliczeniowe. **Płatności online za usługę klient → wykonawca są wyłączone z zakresu.** |
| W08 | Potwierdzone w przepływie kodu. | R12: brak połączenia rzeczywistych opinii klienta z listą wykonawcy. Nie odtwarzano teraz nowej opinii na rzeczywistym koncie. |
| W09 | Potwierdzone próbą obliczeń. | Jedno zamówienie z 2 sesjami daje 2 zamówienia i 2 zamówienia z dodatkiem. PDF nie definiuje docelowego KPI; to problem spójności przy obecnych etykietach. |
| W10 | Potwierdzone próbą obliczeń. | Różne identyfikatory źródeł dzielą usługę i klienta. Wynik próby: 2 klientów dla tego samego e-maila. Szczegółowy model łączenia rekordów wymaga ustalenia. |
| W11 | Potwierdzone z zastrzeżeniem specyfikacji KPI. | Bez przydziału rezerwacje nie wchodzą do obciążenia osób; „Bez przypisania” zwiększa liczbę wierszy. Przydział jest wymagany, konkretne wskaźniki analiz mają być doprecyzowane po Figmie. |
| W12 | Potwierdzone i rozszerzone. | R11: oprócz braku wyceny dystansu istnieje limit 100 km wobec planów 200/300 km. |
| W13 | Potwierdzone. | R09/R24: dane w tekście notatki nie zastępują pozycji wyceny, dodatków i faktury dostępnych do dalszej edycji. |
| W14 | Potwierdzone. | R30: zaproszenie i konto pracownika są wymagane; dokładny katalog dodatkowych ról jest niedopisany w PDF-ie. |
| W15 | Potwierdzone częściowe wdrożenie; doprecyzowane. | R02/R06: lista, akceptacja istniejących zgłoszeń i odnośniki do publicznych rezerwacji są obecne. Brak pełnego edytora projektu. Samo ręczne tworzenie całego projektu nie ma równie jednoznacznego opisu jak dodawanie sesji do istniejącego. |
| W16 | Potwierdzone w kodzie. | Oś tygodnia obejmuje 08–20, dnia 08–21. Wobec wymogu wszystkich zleceń w kalendarzu (Z s. 29) ukrywanie zapisów spoza osi jest problemem. Nie mylić z grafikami pracy, których oś już rozszerza się do zmian. |
| W17 | Potwierdzone w mapowaniu danych. | Kolor ręcznej oferty nie obejmuje tak samo rezerwacji `profile:…`. To błąd istniejącego interfejsu; PDF nie opisuje szczegółowo systemu kolorów. |
| W18 | Potwierdzone z korektą kwalifikacji. | Osobne ustawienia kalendarza nadal są nieaktywne. Zakres wymaga przede wszystkim dni/godzin dostępności, a nie wyłącznie kolorów. Synchronizacja kolorów między urządzeniami nie jest wprost wymagana w PDF-ie. |
| W19 | Potwierdzone, doprecyzowane według rodzaju usługi. | R23: zdjęcia są wprost opisane dla mycia/malowania; obowiązkowe zdjęcia mieszkań wynikają z aktualnej obietnicy przełącznika, nie z równie wyraźnego punktu PDF-a. |
| W20 | **Wniosek częściowo skorygowany.** | R17: brak miesięcznych/dwutygodniowych opcji i osobnych rabatów jest pewny. Obowiązek automatycznego tworzenia przyszłych wizyt nie został jednoznacznie określony. |
| W21 | Potwierdzone w części wymaganej. | R27: własne notatki i pełna historia są wymagane. Fotografie dodawane przez wykonawcę do notatki nie są tak samo opisane; nie mylić ze zdjęciami klienta R23. |
| W22 | Potwierdzone z doprecyzowaniem. | R33: zmiana/potwierdzenie e-maila i usunięcie konta są wymagane. Dochodzi potwierdzenie telefonu. Osobny proces odzyskiwania hasła wykonawcy nie jest jednoznacznie opisany w tej części PDF-a. |
| W23 | Element nadal nie działa, ale nie jest jasnym brakiem zakresowym. | Globalna belka „Szukaj” nie ma działania. PDF wymaga konkretnych wyszukiwarek list, nie opisuje jednoznacznie tej globalnej. Nie należy jej traktować jako samodzielnej niezgodności kontraktowego zakresu na podstawie tego dokumentu. |
| W24 | Potwierdzone; oddzielono rodzaje faktur. | R09/R10: faktury Clingo za abonament i dokumenty wykonawcy do usług to różne obowiązki. Dane do faktury nie oznaczają wystawienia dokumentu. |
| W25 | Potwierdzone i rozszerzone. | R31: poza kopiowaniem i nieobecnościami jest różnica formatu eksportu — CSV zamiast wymaganego PDF. |
| W26 | Potwierdzone. | R30: zdjęcie pracownika jest wyraźnie wymagane na Z s. 34–35. |
| W27 | Potwierdzone. | R22: zgoda istnieje, ale link nie przedstawia właściwego standardu usługi. |

## 5. Funkcje działające w istotnej części zgodnie z opisem

Te elementy nie powinny być ponownie budowane od zera; wymagają domknięcia integracji i brakujących wariantów:

- Logowanie, utworzenie podstawowego konta wykonawcy, wylogowanie, kontrola dostępu do danych własnej działalności oraz zabezpieczenie przed nadpisaniem równoległych zmian. Nie oznacza to realizacji całej opisanej rejestracji abonamentowej.
- Dodawanie i edycja danych pracowników, przypisanie dostępnych podstawowych kategorii i tygodniowych godzin pracy; podsumowania godzin oraz widok dnia/tygodnia grafiku. Grafiki nie są jeszcze źródłem dostępności rezerwacji.
- Kartoteka klientów: kontakt, adres, jedna notatka, wyszukiwanie, podgląd przypisanych zleceń i podstawowe statystyki. Stały rabat, kolekcja notatek i nieobecności klienta pozostają nieukończone.
- Zapis konfiguracji usług, opis, media, stawka powierzchniowa, szkic, publikacja i wycofanie przez archiwizację. Podgląd istnieje. Archiwizacja zachowuje dane i nie jest tym samym co trwałe usunięcie; PDF wymienia „Usuń”, ale nie opisuje oczekiwanej retencji.
- Ciągłość widełek i odrzucanie luk/nakładania przedziałów po stronie walidacji. Część ograniczeń metrażu trafia do publicznej oferty. Nie działa jeszcze właściwa rola liczby osób, klasyfikacja projektów i ograniczenie obsadą.
- Bufor oraz wyprzedzenie są przekazywane do publicznych ustawień rezerwacji i uwzględniane w wyliczaniu terminów. Brak pełnego wspólnego modelu pracowników nadal ogranicza zgodność całego kalendarza. Nie potwierdzono wszystkich kombinacji wielu usług z różnymi buforami.
- Rezerwacja klienta pojawia się w zleceniach wykonawcy; podstawowe odwołanie i przełożenie mają sprawdzenia dostępności, właściciela oraz wersji danych. Odwołanie zwalnia zajętość rezerwacyjną, ale nie wysyła wymaganych wiadomości.
- Odczyt istniejących nieobecności, aktywne/historia, filtry numeru, dat i pracownika oraz anulowanie z możliwością cofnięcia. To nie jest pełny dziennik wszystkich operacji: anulowane wpisy są wykluczane z odczytu, a historia pokazuje zakończone nieanulowane okresy.
- Filtry opinii po usługach, ocenach, zgłoszeniu i słowach oraz okresach działają na dostępnych danych. Nowe opinie klientów trzeba dopiero połączyć z tym źródłem. Wybór dat jest uproszczony do okresów, nie dowolnego zakresu od–do.
- Zmiana nazwy, kontaktu, adresu i hasła oraz zapis preferencji powiadomień. Zapis ustawienia nie dowodzi działania wysyłki, geolokalizacji czy weryfikacji tożsamości.
- Limit rezerwacji klienta do sześciu miesięcy jest uwzględniony w API zgodnie z Z s. 4 i O s. 1. To nie jest to samo co ograniczenie przeglądania historii kalendarza przez wykonawcę.

## 6. Zapisy niejednoznaczne lub wymagające rozstrzygnięcia

Nie należy traktować poniższych punktów jako decyzji już podjętych przez projekt:

| Temat | Co wymaga doprecyzowania |
|---|---|
| Domyślny widok kalendarza | Z s. 27 podaje dzień, Z s. 29 tydzień. Aplikacja startuje na miesiącu bez zapisanej preferencji, mimo domyślnej etykiety dnia w ustawieniach. Trzeba wskazać jeden obowiązujący widok i zasady zapamiętywania. |
| Limit przeglądania kalendarza | Z s. 28 mówi o bieżącym i następnym miesiącu, a mechanika rezerwacji o 6 miesiącach. Może to dotyczyć różnych działań. Nie należy ograniczać przeglądania wykonawcy bez rozstrzygnięcia. |
| Wzór kolejnego przedziału | Z s. 3 podaje „poprzedni minimalny + 1”, co jest sprzeczne z wymaganiem braku nakładania. Kod używa poprzedniego maksimum + 1, co odpowiada ciągłości. Tego nie klasyfikuję jako błędu do zmiany na dosłowny zapis. |
| Dodawanie po „Bez limitu” | PDF zabrania kolejnego przedziału. UI pozwala dodać następny, zamieniając poprzedni nieskończony limit na skończony; końcowa struktura przechodzi walidację. Jest to różnica interakcji, a nie zapis dwóch nieskończonych przedziałów. |
| Globalny maksymalny metraż | O s. 1 wymaga limitu systemowego zależnego od rodzaju usługi, ale dokumenty nie podają kompletnej tabeli wartości. Obecne stałe 10 000 m² i obcięcie do 12 h nie zastępują zatwierdzonej tabeli. |
| Parametry sesji | Minimalne 3 h i przerwa 2 dni są podane jako przykłady. Nie można bez uzgodnienia przyjąć ich jako stałych wymagań. Implementacja dzieli czas na sesje do 8 h i dopuszcza dwa pełne dni przerwy; brakuje przede wszystkim dostępności osób i bilansu roboczogodzin. |
| Kolejne wizyty cykliczne | Czy częstotliwość tylko ustala rabat/preferencję, czy tworzy serię rezerwacji? Jeśli serię, trzeba opisać horyzont, wyjątki, anulowanie i blokowanie terminów. Cztery warianty i niezależne rabaty są wymagane niezależnie od tej decyzji. |
| Role pracowników | PDF wskazuje „Pracownik”, a kolejne pozycje pozostawia puste. Zaproszenie jest wymagane; dokładne uprawnienia dodatkowych ról trzeba ustalić. |
| Weryfikacja firmy | Z s. 38 pozostawia weryfikację konta „do rozkminienia”. Nie można uznać braku konkretnego procesu weryfikacji firmy za naruszenie gotowej specyfikacji. Nie dotyczy to osobno wymaganego potwierdzania e-maila i telefonu. |
| Analizy | Z s. 37 pozostawia opis do Figmy. Trzeba zdefiniować, co oznacza zamówienie, sesja, klient powracający, przychód i wykorzystanie. Błędy obecnych obliczeń pozostają odtwarzalne. |
| Cennik i limity abonamentów | PDF podaje 49,99 / 99,99 / 149,99 zł i promienie 100/200/300 km. Podgląd aplikacji pokazuje inny opis/kwotę. Trzeba potwierdzić aktualny cennik, netto/brutto oraz limity pracowników i ogłoszeń przed podłączeniem płatności. |
| Powód nieobecności i rodzaj usługi | Z s. 28 opisuje wybór rodzaju usługi, Z s. 36 wybór pracowników i powodów. Należy ustalić, czy blokada dotyczy osób, całej działalności czy również wybranej kategorii. Nie zmienia to wymogu działającej blokady rezerwacji. |
| Zakres historii nieobecności i kopii danych | „Pełny wykaz zdarzeń” może oznaczać zakończone okresy albo dziennik operacji, również usunięć. „Kopia swoich danych” nie określa dokładnego zestawu. Obecne ograniczenia są opisane, ale docelowy model wymaga decyzji. |

## 7. Dowody i zakres ponownej weryfikacji

### Sprawdzenia wykonane w tym porównaniu

- Odczytano oba PDF-y, a istotne strony mechanik i perspektywy wykonawcy obejrzano również po wyrenderowaniu, wraz z osadzonymi zrzutami i wyróżnieniami. Nie oparto oceny wyłącznie na nazwach ekranów.
- Ponownie uruchomiono podstawowy zestaw testów wykonawcy: **52/52 zaliczone**, wraz z kompilacją API.
- Ponownie uruchomiono testy analiz, mediów, pojedynczych zamówień i wyszukiwania oraz testy mechaniki rezerwacji: **26/26 zaliczone**. Łącznie w tej rundzie: **78 testów, 0 niepowodzeń** w tych dwóch zestawach.
- Ponownie sprawdzono w przeglądarce formularz nieobecności, czat, płatności i osobne ustawienia kalendarza na kontrolowanych odpowiedziach API. Brak zapisu, niedziałająca zmiana planu i nieaktywne elementy zostały potwierdzone. Testy nie używały rzeczywistego konta użytkownika.
- Uruchomiono dodatkowe próby bez bazy produkcyjnej: wycena 100 m² dla 2 osób, publikacja maksimum 1000 m², walidacja 50 osób, własny dodatek w katalogu, bezpłatny dodatek, zasięg 200 km i wcześniejsze zakończenie rezerwacji. Wyniki potwierdzają R01, R02, R04, R07, R11, R18, R19.
- Powtórzono próbę obliczeń analiz: 1 rezerwacja/2 sesje → 2 zamówienia i 2 naliczenia dodatku; ten sam e-mail z dwóch źródeł → 2 klientów. Wniosek o niespójności jest aktualny.
- Ponownie prześledzono kod źródłowy pozostałych ustaleń, w szczególności publikację oferty, zapis rezerwacji, przypisania, notatki, opinie, klientów i ustawienia.

**Ważne:** testy aplikacji potwierdzają obecne założenia implementacji. Ich przejście nie oznacza zgodności z PDF-em. Przykładowo obecne obcięcie oferty do 12 h może być poprawnie obsłużone przez kod, a nadal różnić się od wymaganego projektu wielosesyjnego.

Z pierwszego audytu pozostają również pozytywne wyniki dwóch testów integracyjnych z prawdziwym API i PostgreSQL oraz kompilacji panelu. Nie uruchamiano ich ponownie w tej rundzie i nie przedstawiono ich jako dowodu zakończenia wszystkich procesów z zakresu.

### Pliki dowodowe

Ścieżki względem `outputs/clingo-platform`:

| Dowód | Plik |
|---|---|
| 52 testy i kompilacja API | `tmp/provider-scope-core-tests.log` |
| 26 testów dodatkowych | `tmp/provider-scope-extra-tests.log` |
| Próby zgodności z zakresem i zapis wyników | `tmp/provider-scope-probes.cjs`, `tmp/provider-scope-probes.json` |
| Powtórne sprawdzenie czterech widoków | `tmp/provider-audit-ui.cjs`, `tmp/provider-audit-ui.log` |
| Powtórna próba analiz | `tmp/provider-audit-probes.cjs` |

### Kluczowe miejsca implementacji

| Ustalenia | Źródła w projekcie |
|---|---|
| R01–R04, R11, R17–R23 | `apps/api/src/provider/provider-offer-publication.ts`, `provider-offers.input.ts`, `provider-offers.service.ts`; `apps/api/src/dashboard/area-pricing.ts`, `booking.ts`, `booking.service.ts`; `apps/provider/lib/provider-offers.ts`; `apps/provider/components/provider-service-config-page.tsx` |
| R03, R05, R26, R38 | `apps/api/src/dashboard/booking-bridge.ts`; `apps/api/src/provider/provider-jobs.service.ts`, `provider-absences.service.ts`, `provider-absences.controller.ts`; `apps/provider/components/provider-absence-form.tsx`, `provider-absence-manager.tsx` |
| R06–R09, R24–R29 | `apps/provider/components/provider-order-details.tsx`, `provider-single-order-editor.tsx`, `provider-multi-session-orders-page.tsx`; `apps/api/src/provider/provider-bookings.service.ts`, `provider-multi-orders.service.ts`; `apps/api/src/dashboard/booking.service.ts` |
| R10, R13–R15, R30, R33–R36 | `apps/provider/components/provider-login-page.tsx`, `provider-payment-methods-page.tsx`, `provider-change-card-dialog.tsx`, `provider-invoice-details-page.tsx`, `provider-employee-form-page.tsx`, `provider-settings-data-page.tsx`, `provider-settings-calendar-page.tsx`, `provider-shell.tsx` |
| R12 i opinie | `apps/api/src/dashboard/customer.service.ts`; `apps/api/src/provider/provider-reviews.service.ts`; `apps/provider/components/provider-reviews-page.tsx` |
| R11, R31–R32 | `apps/api/src/provider/provider-location.input.ts`, `provider-clients.entity.ts`; `apps/provider/components/provider-work-schedules-page.tsx`, `provider-clients-page.tsx` |
| Kalendarz i analizy | `apps/provider/components/provider-jobs-page.tsx`; `apps/provider/lib/provider-analytics.ts`, `provider-analytics-dashboard.ts`; `apps/web/app/standardy-uslug/page.tsx` dla treści linku do standardów |

## 8. Zalecana kolejność domknięcia zakresu

1. Uzgodnić niejasności dotyczące cykliczności, parametrów sesji, widoku domyślnego i tabeli maksymalnych metraży. Nie blokuje to prac nad jednoznacznie opisanym przydziałem osób.
2. Zbudować wspólny model dostępności i obsady: widełki, wydajność, grafiki, nieobecności, wiele osób w sesji i kolizje per pracownik. Naprawić publikację większych metraży i automatyczną klasyfikację projektu.
3. Dokończyć pełny edytor projektu, roboczogodziny, dodawanie/usuwanie sesji, edycję trwającej sesji, wcześniejsze zakończenie i zwalnianie terminów.
4. Domknąć rezerwację i rozliczenie: strukturalne dodatki, rabaty i faktury VAT/Pro forma; następnie właściwe warianty częstotliwości, odkurzacza, dojazdu i zdjęć.
5. Uruchomić czat, powiadomienia i rzeczywiste opinie, a równolegle abonament wykonawcy, rejestrację i aktywację. Nie dodawać płatności online za usługę jako warunku zgodności z tym zakresem.
6. Uzupełnić kartotekę klientów, konta pracowników, eksport PDF, pomoc i ustawienia. Poprawić analizy po ujednoliceniu źródeł danych oraz zatwierdzeniu definicji wskaźników.
7. Odbiór oprzeć na scenariuszach z dokumentów, np. 2 wolne osoby mimo 1 zajętej; urlop części zespołu; zlecenie przekraczające dzień; edycja składu sesji; zakończenie projektu z przyszłymi sesjami; rabat i dokument rozliczeniowy; wiadomości o przełożeniu. Osobno sprawdzić zgodność widoków z Figmą.

## Ograniczenia

Raport dotyczy lokalnego kodu i wskazanych testów, nie stanu zewnętrznego wdrożenia. Nie jest pełnym audytem bezpieczeństwa, wydajności, wszystkich urządzeń ani całej perspektywy klienta/admina. Funkcje klienta sprawdzano w zakresie wpływającym na ofertę, rezerwację i panel wykonawcy. Nie testowano prawdziwych obciążeń kart, dostaw SMS/e-mail ani nowej opinii na rzeczywistym koncie. Nie wykonywano pełnego porównania wszystkich ekranów z Figmą.

W tej rundzie nie naprawiano aplikacji i nie zmieniano danych `kounterstrike6@gmail.com` / `testFirma`. Utworzono nowy raport i lokalne materiały weryfikacyjne. Poprzedni raport pozostawiono jako historię audytu; przy interpretacji jego ustaleń należy korzystać z korekt i mapowania w niniejszym dokumencie.
