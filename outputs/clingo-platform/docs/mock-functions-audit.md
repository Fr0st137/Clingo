# Przegląd niedokończonych funkcji klienta — 9 września 2026

Przegląd kodu tablicy, wyszukiwarki, czatu i ustawień. To lista potwierdzonych braków w tych ekranach, nie pełny odbiór zakresu z PDF.

| Funkcja | Obecne zachowanie | Miejsce w kodzie |
| --- | --- | --- |
| Dopasowanie ogłoszeń do rodzaju usługi, metrażu i lokalizacji | Pola przechodzą do adresu strony i profilu oferty, ale lista na tablicy nie jest według nich filtrowana. Dostępność metrażu i obszaru jest sprawdzana dopiero w ofercie. | `apps/web/components/board-interactive-view.tsx`, `apps/web/lib/offer-request.ts` |
| Ułatwienia przy zamówieniu | Zaznaczenia „Bez wymaganych zdjęć lokalu” i „Wykonawca zapewnia odkurzacz” zmieniają stan przycisków, ale nie filtrują wyników. | `apps/web/components/board-filters.tsx`, `apps/web/components/board-interactive-view.tsx` |
| Czat | Pokazuje wczytane przykładowe rozmowy. Wysłanie wiadomości, załączniki, zmiana rozmówcy i paski przewijania nie mają obsługi. Działa wyszukiwanie nazw na liście kontaktów. | `apps/web/components/chat-view.tsx` |
| Podpowiedzi adresów | Pole przyjmuje wpisany adres, ale nie odpytuje geokodera ani map. Usunięto stałą podpowiedź przykładowego adresu. | `apps/web/public/clingo-homepage/main.js` |
| E-mail i SMS | Preferencje powiadomień zapisują się na koncie; wysyłka powiadomień nie jest uruchomiona. | `apps/web/components/settings-section.tsx` |
| Google, Facebook, Apple | Logowanie i łączenie tych kont nie są dostępne; ekran ustawień o tym informuje. | `apps/web/components/settings-section.tsx` |
| Linki informacyjne | Pomoc w panelu oraz Warunki użytkowania, Polityka prywatności i Dane firmy w formularzu rejestracji prowadzą do `#`. | `apps/web/components/sidebar.tsx`, `apps/web/components/auth-view.tsx` |
| Liczba specjalistów na stronie głównej | Liczba 12 348 jest wpisana w szablon, bez powiązania z bazą. | `apps/web/public/clingo-homepage/index.html` |

## Wprowadzone w tej zmianie

- Tablica korzysta z szablonu, stylów i obsługi paska strony głównej.
- Wspólne rozwijanie rodzaju usługi i metrażu, edycja oraz czyszczenie adresu, zatwierdzanie Enterem.
- Wybór i ilości dodatków z paska trafiają do filtrów, adresu strony oraz linków do ofert. Boczne filtry i czyszczenie wyboru aktualizują pasek.
- Stabilne osadzenie szablonu zapobiega usuwaniu obsługi kliknięć przy ponownym renderowaniu.
- Usunięte przykładowe wartości początkowe tablicy, podwójne Prasowanie i stały adres. Limit dodatków wynosi 20, zgodnie z obsługą zamówień.
- Wyszukiwarka wykonawcy w górnym pasku podpowiada profile po imieniu, nazwisku lub nazwie firmy i otwiera wybrany profil. Dopasowanie ignoruje wielkość liter, polskie znaki i kolejność wpisanych fragmentów.

## Weryfikacja

Kontrola typów oraz 8 istniejących testów metrażu, lokalizacji, dodatków i paginacji przeszły. Kontrola przeglądarkowa korzystała z tymczasowego katalogu testowego: lokalny Docker nie udostępnił bazy. Test nie potwierdza dostępności działającego API ani bazy danych.
