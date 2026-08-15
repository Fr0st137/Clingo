"use client";

import { CSSProperties, FormEvent, useEffect, useState } from "react";

type TopbarProps = {
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
};

const assetPath = (path: string) => `/clingo-homepage/${path}`;

export function Topbar({ isMenuOpen = false, onMenuToggle }: TopbarProps) {
  const [panelType, setPanelType] = useState<"notification" | "favorites" | "chat">("notification");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(isMenuOpen);

  const effectiveMobileOpen = isMenuOpen || isMobileOpen;
  const panelCopy = {
    notification: {
      title: "Powiadomienia",
      text: "Zaloguj się, aby otrzymywać powiadomienia o zamówieniach, statusach i promocjach."
    },
    favorites: {
      title: "Ulubione",
      text: "Zaloguj się i twórz listę ulubionych, aby łatwo wracać do najciekawszych propozycji."
    },
    chat: {
      title: "Chat",
      text: "Zaloguj się, aby korzystać z chatu i łatwo komunikować się z usługodawcami."
    }
  };

  useEffect(() => {
    setIsAuthenticated(document.cookie.split("; ").some((cookie) => cookie === "clingo-auth=1"));
  }, []);

  const submitHeaderSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("header-search") || "").trim();
    const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
    window.location.href = `/tablica-ogloszen${suffix}`;
  };

  const togglePanel = (nextPanelType: "notification" | "favorites" | "chat") => {
    const shouldClose = isPanelOpen && panelType === nextPanelType;
    setPanelType(nextPanelType);
    setIsPanelOpen(!shouldClose);
    setIsAccountPanelOpen(false);
  };

  const toggleAccountPanel = () => {
    setIsPanelOpen(false);
    setIsAccountPanelOpen((value) => !value);
  };

  const toggleMobile = () => {
    setIsPanelOpen(false);
    setIsAccountPanelOpen(false);
    setIsMobileOpen((value) => !value);
    onMenuToggle?.();
  };

  return (
    <>
      <link rel="stylesheet" href="/clingo-homepage/styles/header-not-login.css" />
      <header
        className={`header-not-login clingo-app-header${effectiveMobileOpen ? " is-mobile-menu-open" : ""}`}
        style={{ "--color-white": "#ffffff" } as CSSProperties}
      >
        <div className="header-not-login__inner">
          <div className="header-not-login__left-group">
            <a className="header-not-login__logo" href="/home" aria-label="Clingo">
              <img src={assetPath("assets/images/logo-clingo-color-new.png")} alt="Clingo" />
            </a>

            <nav className="header-not-login__nav" aria-label="Główna nawigacja">
              <a className="header-not-login__nav-link header-not-login__nav-link--narrow" href="/home#jak-to-dziala">
                Jak to działa?
              </a>
              <a className="header-not-login__nav-link" href="/standardy-uslug">
                Standardy usług Clingo
              </a>
            </nav>
          </div>

          <form className="header-not-login__search" role="search" onSubmit={submitHeaderSearch}>
            <label className="header-not-login__search-label" htmlFor="header-search">
              Szukaj
            </label>
            <span className="header-not-login__search-icon" aria-hidden="true">
              <img src={assetPath("assets/icons/header-search.svg")} alt="" />
            </span>
            <input
              id="header-search"
              name="header-search"
              className="header-not-login__search-input"
              type="search"
              placeholder="Imię i nazwisko | Nazwa firmy"
            />
          </form>

          <div className="header-not-login__actions" aria-label="Szybkie akcje">
            <div
              className={`header-not-login__notifications-menu${isPanelOpen ? " is-open" : ""}`}
              data-panel-type={panelType}
            >
              <div className="header-not-login__notifications-icons">
                <button
                  className="header-not-login__icon-button header-not-login__icon-button--notification"
                  type="button"
                  aria-label="Powiadomienia"
                  aria-expanded={isPanelOpen && panelType === "notification"}
                  onClick={() => togglePanel("notification")}
                >
                  <img src={assetPath("assets/icons/header-notification-bell.svg")} alt="" />
                </button>

                <button
                  className="header-not-login__icon-button header-not-login__icon-button--favorites"
                  type="button"
                  aria-label="Ulubione"
                  aria-expanded={isPanelOpen && panelType === "favorites"}
                  onClick={() => togglePanel("favorites")}
                >
                  <img src={assetPath("assets/icons/header-heart.svg")} alt="" />
                </button>

                <button
                  className="header-not-login__icon-button"
                  type="button"
                  aria-label="Wiadomości"
                  aria-expanded={isPanelOpen && panelType === "chat"}
                  onClick={() => togglePanel("chat")}
                >
                  <img src={assetPath("assets/icons/header-chat.svg")} alt="" />
                </button>
              </div>

              <div className="header-not-login__notifications-panel" aria-label={panelCopy[panelType].title}>
                <img
                  className="header-not-login__notifications-shape"
                  src={assetPath("assets/images/header-notifications-shape.svg")}
                  alt=""
                  aria-hidden="true"
                />
                <div className="header-not-login__notifications-divider" aria-hidden="true" />

                <div className="header-not-login__notifications-content">
                  <p className="header-not-login__notifications-title">{panelCopy[panelType].title}</p>
                  <p className="header-not-login__notifications-text">{panelCopy[panelType].text}</p>
                  <a className="header-not-login__notifications-login" href="/logowanie?next=/zamowienia">
                    Zaloguj się
                  </a>
                  <p className="header-not-login__notifications-register">
                    Nie masz konta? <a href="/logowanie?mode=register&next=/zamowienia">Zarejestruj się</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              {isAuthenticated ? (
                <a className="header-not-login__account-button" href="/zamowienia">
                  Moje konto
                </a>
              ) : (
                <button
                  aria-expanded={isAccountPanelOpen}
                  className="header-not-login__account-button border-0"
                  onClick={toggleAccountPanel}
                  type="button"
                >
                  Moje konto
                </button>
              )}

              {!isAuthenticated && isAccountPanelOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[300px] rounded-[20px] border border-[#e6edf3] bg-white p-5 text-[#2e3b4c] shadow-[0px_12px_32px_rgba(35,77,126,0.16)]">
                  <p className="m-0 text-[18px] font-semibold leading-6">Moje konto</p>
                  <p className="mb-4 mt-2 text-[14px] leading-5 text-[#7c8691]">
                    Zaloguj się albo utwórz konto, żeby przejść do panelu i rezerwacji.
                  </p>
                  <a
                    className="flex h-[42px] items-center justify-center rounded-[100px] bg-[#0079de] text-[14px] font-semibold text-white"
                    href="/logowanie?next=/zamowienia"
                  >
                    Zaloguj się
                  </a>
                  <p className="mb-0 mt-3 text-center text-[14px] leading-5 text-[#7c8691]">
                    Nie masz konta?{" "}
                    <a className="font-semibold text-[#0079de]" href="/logowanie?mode=register&next=/zamowienia">
                      Zarejestruj się
                    </a>
                  </p>
                </div>
              ) : null}
            </div>

            <div className="header-not-login__contractor-menu">
              <button className="header-not-login__contractor-button" type="button" aria-haspopup="true">
                <span>Dla Wykonawców</span>
                <img src={assetPath("assets/icons/header-angle-down.svg")} alt="" aria-hidden="true" />
              </button>

              <div className="header-not-login__contractor-dropdown" aria-label="Menu dla wykonawców">
                <a className="header-not-login__contractor-dropdown-link" href="/logowanie?next=/zamowienia">
                  Zaloguj się
                </a>
                <a className="header-not-login__contractor-dropdown-link" href="/logowanie?mode=register&next=/zamowienia">
                  Zostań Wykonawcą
                </a>
              </div>
            </div>

            <button
              className="header-not-login__mobile-toggle"
              type="button"
              aria-label="Otwórz menu"
              aria-expanded={effectiveMobileOpen}
              onClick={toggleMobile}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <div className="header-not-login__mobile-backdrop" onClick={toggleMobile} />
          <div className="header-not-login__mobile-menu">
            <form className="header-not-login__mobile-search" role="search" onSubmit={submitHeaderSearch}>
              <label className="header-not-login__search-label" htmlFor="header-search-mobile">
                Szukaj
              </label>
              <span className="header-not-login__search-icon" aria-hidden="true">
                <img src={assetPath("assets/icons/header-search.svg")} alt="" />
              </span>
              <input
                id="header-search-mobile"
                name="header-search"
                className="header-not-login__search-input"
                type="search"
                placeholder="Imię i nazwisko | Nazwa firmy"
              />
            </form>

            <nav className="header-not-login__mobile-nav" aria-label="Mobilna nawigacja">
              <a className="header-not-login__mobile-link" href="/home#jak-to-dziala">
                Jak to działa?
              </a>
              <a className="header-not-login__mobile-link" href="/standardy-uslug">
                Standardy usług Clingo
              </a>
              <a className="header-not-login__mobile-link" href="/ulubione">
                Ulubione
              </a>
              <a className="header-not-login__mobile-link" href="/logowanie?next=/zamowienia">
                Moje konto
              </a>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
