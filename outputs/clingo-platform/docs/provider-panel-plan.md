# Plan eksportu z Figmy i implementacji panelu wykonawcy

## 1. Decyzja architektoniczna

Panel wykonawcy powstaje jako osobna aplikacja Next.js w istniejącym monorepo:

```text
apps/
  web/       # obecna strona publiczna i panel klienta
  provider/  # nowy panel wykonawcy
  api/       # wspólne API NestJS
packages/
  ui/        # współdzielone tokeny i naprawdę wspólne komponenty
  contracts/ # współdzielone typy żądań i odpowiedzi API
```

Docelowe adresy:

- `clingo.pl` - strona publiczna i część klienta,
- `panel.clingo.pl` - panel wykonawcy,
- `api.clingo.pl` - wspólne API.

Lokalnie aplikacje działają odpowiednio na portach 3000, 3001 i 4000. Panel używa własnej warstwy pośredniej Next.js do komunikacji z API. Token sesji pozostaje w ciasteczku HttpOnly i nie jest odczytywany przez kod przeglądarkowy.

## 2. Warunek przed budową ekranów

Obecny model kont nie rozróżnia klienta i wykonawcy, a publiczne profile wykonawców nie mają właściciela konta. Przed podłączeniem prawdziwych danych potrzebne są:

1. `provider_accounts` - firma lub działalność wykonawcy.
2. `provider_memberships` - powiązanie użytkownika z wykonawcą oraz rola: właściciel, administrator albo pracownik.
3. Powiązanie publicznego `provider_profile` z `provider_account`.
4. Kontrola uprawnień w API dla każdej operacji wykonawcy.
5. Osobna sesja panelu na `panel.clingo.pl` albo kontrolowany mechanizm logowania między subdomenami. Pierwsza wersja może używać tego samego konta i osobnego ciasteczka panelu.

Uprawnień nie wolno opierać wyłącznie na ukrywaniu przycisków. API za każdym razem sprawdza członkostwo i rolę użytkownika.

## 3. Przygotowanie projektu w Figmie

Przed eksportem tworzymy spis ekranów. Każdy ekran otrzymuje osobny link do konkretnego frame'a z `node-id`, zamiast linku wyłącznie do całego pliku.

Minimalny porządek projektu:

1. Foundations - kolory, typografia, odstępy, promienie, cienie i siatka.
2. Components - warianty nawigacji, pól, przycisków, tabel, kart, statusów, modali i kalendarza.
3. Desktop screens - kompletne widoki 1440 px.
4. Responsive screens - co najmniej szerokości 1024 px i 390 px dla ekranów używanych mobilnie.
5. States - ładowanie, pusta lista, błąd, brak uprawnień, zapis w toku, sukces i konflikt danych.

Dla każdego ekranu zapisujemy w `docs/provider-figma-map.md`:

| Pole | Zawartość |
| --- | --- |
| Trasa | np. `/zamowienia` |
| Figma | link z `node-id` |
| Warianty | desktop, tablet, mobile |
| Stany | loading, empty, error, success |
| Dane | endpointy oraz akcje użytkownika |
| Status | do pobrania, w budowie, QA, gotowe |

## 4. Pobieranie kontekstu i zasobów z Figmy

Dla każdego widoku stosujemy ten sam proces:

1. Pobieramy kontekst głównego frame'a przez `get_design_context`.
2. Jeżeli frame jest zbyt duży, pobieramy osobno jego logiczne sekcje, np. nawigację, kalendarz i panel szczegółów.
3. Kod zwrócony przez Figmę traktujemy jako opis układu. Dopasowujemy go do komponentów, tokenów i konwencji repozytorium, zamiast kopiować wprost.
4. Najpierw wykorzystujemy Code Connect i istniejące komponenty. Następnie adnotacje projektowe i zmienne Figmy.
5. Każdą ikonę i grafikę pobieramy w oryginalnej postaci zwróconej przez Figmę. Nie przerysowujemy SVG ręcznie.
6. Zasoby trwałe zapisujemy w `apps/provider/public/figma-assets/`. Tymczasowych adresów Figmy nie zostawiamy w kodzie, ponieważ wygasają.
7. Po wdrożeniu robimy zrzut ekranu w tej samej rozdzielczości i porównujemy go z frame'em.

Nie eksportujemy całej strony jako wygenerowanego HTML. Eksportujemy kontekst, tokeny i oryginalne zasoby, a ekran budujemy z komponentów aplikacji.

## 5. Fundament nowej aplikacji

Pierwszy etap kodowania obejmuje:

1. Utworzenie `apps/provider` na tej samej wersji Next.js, Reacta i Tailwinda co `apps/web`.
2. Konfigurację lokalnego portu 3001 i zmiennych środowiskowych.
3. Layout panelu: boczne menu, górny pasek, obszar treści, komunikaty i obsługa małych ekranów.
4. Tokeny wizualne odwzorowane z Figmy.
5. Warstwę proxy do API i ochronę tras wykonawcy.
6. Podstawowe komponenty: przycisk, pole, select, karta, status, tabela, modal, drawer, skeleton i komunikat błędu.
7. Obsługę dat w strefie `Europe/Warsaw` i jeden wspólny format dat oraz godzin.

Komponent przenosimy do `packages/ui` tylko wtedy, gdy rzeczywiście jest używany również w aplikacji klienta. Elementy specyficzne dla panelu zostają w `apps/provider`.

## 6. Kolejność implementacji funkcji

### Etap A - szkielet i dashboard

- layout oraz nawigacja,
- strona główna wykonawcy,
- dzienny i tygodniowy kalendarz,
- podsumowanie najbliższych zleceń,
- pełne stany ładowania, pustki i błędu.

### Etap B - zamówienia

- lista i filtrowanie zamówień,
- szczegóły zlecenia,
- przełożenie, odwołanie i edycja,
- przypisanie pracowników,
- notatki i historia zmian,
- oznaczenie wykonania oraz rozliczenie poza platformą.

### Etap C - projekty wielosesyjne

- harmonogram sesji,
- godziny wymagane, zaplanowane i pozostałe,
- wykrywanie konfliktów pracowników,
- edycja i odwołanie całego projektu albo pojedynczej sesji.

### Etap D - operacje wykonawcy

- klienci i historia współpracy,
- pracownicy,
- nieobecności,
- godziny pracy i blokady kalendarza.

### Etap E - oferta publiczna

- konfiguracja usług,
- widełki metrażowe i wydajność,
- cennik oraz dodatki,
- zasięg działania,
- edycja profilu, galerii i opisów.

### Etap F - funkcje uzupełniające

- opinie,
- ustawienia i powiadomienia,
- analizy,
- czat i centrum powiadomień.

Płatności subskrypcyjne wykonawcy pozostają poza pierwszym zakresem. W interfejsie nie tworzymy atrap aktywnych płatności.

## 7. Sposób realizacji pojedynczego ekranu

Każdy ekran przechodzi przez ten sam mały cykl:

1. Wybranie frame'a i wszystkich stanów w Figmie.
2. Pobranie kontekstu oraz oryginalnych zasobów.
3. Sprawdzenie, które elementy już istnieją w repozytorium.
4. Zdefiniowanie kontraktu API i reguł uprawnień.
5. Zbudowanie statycznego układu z prawidłową responsywnością.
6. Podłączenie rzeczywistych danych i akcji.
7. Dodanie stanów: loading, empty, error, success i konflikt.
8. Test istotnych reguł biznesowych oraz kontroli dostępu.
9. Porównanie wizualne z Figmą w ustalonych szerokościach.
10. Oznaczenie ekranu jako gotowego w mapie Figmy.

## 8. Kryteria ukończenia ekranu

Ekran jest gotowy dopiero wtedy, gdy:

- odpowiada właściwemu frame'owi, a nie tylko ogólnemu stylowi,
- działa z prawdziwym API i nie pokazuje danych demonstracyjnych jako rzeczywistych,
- każda operacja jest ograniczona do zalogowanego wykonawcy,
- obsługuje stany ładowania, braku danych, błędu i konfliktu,
- działa przy użyciu klawiatury i ma poprawne etykiety dostępności,
- zachowuje się poprawnie w uzgodnionych szerokościach,
- nie korzysta z wygasających adresów zasobów Figmy,
- przechodzi kontrolę typów, test reguł biznesowych i wizualne QA.

## 9. Pierwszy pakiet do realizacji

Pierwszy pionowy fragment powinien zawierać:

1. Szkielet `apps/provider`.
2. Ochronę tras i identyfikację wykonawcy.
3. Layout z Figmy.
4. Dashboard z tygodniowym kalendarzem.
5. Listę zleceń na wybrany dzień.
6. Drawer lub stronę podstawowych szczegółów zlecenia.

Ten pakiet sprawdzi jednocześnie architekturę subdomeny, sesję, uprawnienia, komponenty, API, kalendarz i proces design-to-code. Dopiero po jego odbiorze rozszerzamy panel o kolejne moduły.

## 10. Materiały potrzebne do startu

- link do pliku Figmy,
- link z `node-id` do layoutu panelu,
- link z `node-id` do dashboardu lub pierwszego ekranu,
- warianty tego ekranu i jego stany, jeżeli są przygotowane,
- docelowa nazwa subdomeny; domyślnie przyjmujemy `panel.clingo.pl`.
