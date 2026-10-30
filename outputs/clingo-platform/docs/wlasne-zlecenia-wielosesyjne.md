# Własne zlecenia wielosesyjne — 30.10.2026

W panelu: **Dodaj zlecenie → Zamówienie wielosesyjne**. Pierwszy formularz zbiera klienta, powierzchnię, usługę, adres, dodatki i własne pozycje. „Dalej” otwiera planowanie; na tym etapie nic nie rezerwuje jeszcze pracowników. Formularz pozostaje w bieżącej karcie przeglądarki, oddzielnie dla każdej firmy, i można wrócić do niego po odświeżeniu.

## Ekrany i zachowanie

- [Szczegóły](https://www.figma.com/design/S7ZbrUvpGWJSEBj8c1R1cG/TEST---Plac-zabaw?node-id=6380-11348): okno 600 × 770 px, rzeczywiści klienci i niearchiwalne usługi, uzupełnianie adresu z kartoteki.
- [Usługi dodatkowe](https://www.figma.com/design/S7ZbrUvpGWJSEBj8c1R1cG/TEST---Plac-zabaw?node-id=6380-11445): zachowanie ilości i własnych pozycji przy przełączaniu zakładek.
- [Wybór dodatków](https://www.figma.com/design/S7ZbrUvpGWJSEBj8c1R1cG/TEST---Plac-zabaw?node-id=6372-11089): osobne okno 735 px, cztery kolumny na komputerze, dwie na telefonie, oryginalne ilustracje i ikony. Wybór, ilości 0–100, zaznaczenie, zatwierdzenie oraz anulowanie zmian. Lista i nazwy pochodzą z konfiguracji usługi; przykładowa, powtórzona w Figmie pozycja „Prasowanie” nie tworzy dodatkowego naliczenia ani wymyślonej usługi.
- [Planowanie](https://www.figma.com/design/S7ZbrUvpGWJSEBj8c1R1cG/TEST---Plac-zabaw?node-id=6454-14923): dane klienta, rzeczywista wycena, rabat, bilans roboczogodzin, przydzielone osoby, tygodniowy kalendarz oraz inne zamówienia firmy. Można dodać sesję także przez kliknięcie godziny kalendarza. Formularz terminu wykorzystuje istniejący edytor sesji projektu.

Cena uwzględnia dokładną powierzchnię, stawkę oferty, wybrane dodatki, ilości, własne pozycje i jeden rabat. „Rozlicz” otwiera wycenę oraz zmianę uzgodnionej ceny podstawowej; nie oznacza otrzymania płatności. Wymagana praca pochodzi z wydajności pojedynczej osoby. Dodatki rozliczane za pół godziny zwiększają pracę według tej samej reguły co rezerwacje publiczne. Własnym pozycjom nie przypisujemy wymyślonego czasu wykonania.

## Zapis i bezpieczeństwo

„Zapisz” wymaga 2–186 przyszłych sesji i co najmniej jednej przypisanej osoby na sesję. Sprawdza kwalifikacje, grafik, nieobecności, istniejące rezerwacje, inne zlecenia, bufor, nakładanie się sesji i limit firmy. Brakujące lub nadmiarowe godziny oraz mniejsza niż sugerowana obsada wymagają osobnych potwierdzeń.

Serwer ponownie wylicza cenę i pracę z zapisanej konfiguracji. Zmiana konfiguracji podczas planowania wymaga odświeżenia. Wspólna blokada firmy obejmuje cały zapis projektu i terminów, więc konkurujące zapisy nie rezerwują tych samych osób. Powtórzenie identycznego zapisu z identyfikatorem formularza zwraca istniejący projekt. Zmieniony zapis z tym samym identyfikatorem jest odrzucany.

Projekt zostaje przyjęty jako zlecenie własne, a jego sesje pojawiają się w kalendarzu i na liście zleceń. Łączna cena jest dokładnie rozdzielana między sesje. Dane kontaktowe, adres, wycena, dodatki oraz podstawa roboczogodzin są zachowane. Dalsza edycja korzysta z R06; zakończenie z R07. Obce konta i pracownicy bez uprawnień zarządzania nie mogą tworzyć takich projektów.

Nie dodano wysyłki wiadomości, potwierdzania otrzymania płatności ani nowego przechowywania zdjęć w notatkach. To odrębne istniejące zakresy. Notatki własne oraz kontakt i uwagi z kartoteki są dostępne w tym widoku.

## Baza i sprawdzenie

Po wcześniejszych migracjach R06/R07 zastosuj `apps/api/src/database/migrations/20261030-manual-projects.sql`. Dostosowuje ograniczenie liczby sesji do istniejącej edycji projektu: 1–186 w przechowywanym projekcie, przy zachowaniu minimum dwóch w nowym formularzu. Nie zmienia zapisanych projektów ani cen. Nowe dane mieszczą się w istniejącym `project_data`.

Polecenia z katalogu projektu:

```sh
npm run test:manual-projects
npm run verify:manual-projects
```

Weryfikacja wymaga lokalnego PostgreSQL oraz API na 4000 i panelu na 3001. Używa oddzielnych kont i usuwa ich dane. Obejmuje rzeczywiste kliknięcia, ilości dodatków, anulowanie wyboru, własne pozycje, odświeżenie formularza, dodanie obsady i sesji, rabat, zapis, późniejszą edycję, ponowienia i konkurujące zapisy, role, własność oraz niedostępność pracowników. Zrzuty i wyniki są w `tmp/manual-project-*`. Kontrola typów panelu i powiązane testy reguł projektów również przeszły.
