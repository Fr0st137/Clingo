"use client";

import { Bell, Heart, Home, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { ClingoLogo } from "./clingo-logo";

type TopbarProps = {
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
};

export function Topbar({ isMenuOpen = false, onMenuToggle }: TopbarProps) {
  const [searchValue, setSearchValue] = useState("");

  function submitSearch() {
    const query = searchValue.trim();
    const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
    window.location.href = `/tablica-ogloszen${suffix}`;
  }

  return (
    <header className="fixed left-0 top-0 z-30 w-full border-b border-[#e6eef8]/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto grid min-h-[60px] w-full max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 md:grid-cols-[auto_auto_minmax(260px,410px)_auto_auto_auto] md:gap-8 md:px-0 md:py-0">
        <button
          aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#e6eef8] bg-white text-[#61738a] transition-all hover:border-clingo-blue hover:text-clingo-blue md:hidden"
          onClick={onMenuToggle}
          type="button"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <ClingoLogo />

        <nav className="hidden items-center gap-[38px] whitespace-nowrap text-[13px] text-[#26364a] md:flex">
          <a className="transition-all hover:text-clingo-blue" href="/home#jak-to-dziala">
            Jak to działa?
          </a>
          <a className="transition-all hover:text-clingo-blue" href="/standardy-uslug">
            Standardy usług Clingo
          </a>
        </nav>

        <label className="order-last col-span-3 flex h-[38px] items-center gap-3 rounded-xl border border-[#edf2f8] bg-[#f3f7fc] px-[17px] transition-all focus-within:border-clingo-blue focus-within:bg-white md:order-none md:col-span-1 md:rounded-full">
          <Search className="h-[16px] w-[16px] text-[#7c8da2]" strokeWidth={2} />
          <input
            className="w-full bg-transparent text-[13px] text-[#7a8798] outline-none placeholder:text-[#7a8798]"
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitSearch();
              }
            }}
            placeholder="Imię i nazwisko | Nazwa firmy"
            value={searchValue}
          />
        </label>

        <div className="hidden items-center gap-[14px] md:flex">
          {[
            { label: "Powiadomienia", href: "#", icon: Bell },
            { label: "Ulubione", href: "/ulubione", icon: Heart },
            { label: "Home", href: "/home", icon: Home }
          ].map(({ icon: Icon, href, label }) => (
            <a
              aria-label={label}
              className="grid h-[34px] w-[34px] place-items-center rounded-full border border-[#e9f0f8] bg-[#f6f9fd] text-[#8291a4] transition-all hover:border-clingo-blue hover:text-clingo-blue"
              href={href}
              key={label}
            >
              <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
            </a>
          ))}
        </div>

        <a className="hidden h-[38px] min-w-[116px] rounded-full bg-clingo-blue px-6 py-[11px] text-center text-[13px] font-bold leading-none text-white shadow-sm transition-all hover:bg-clingo-blueDark md:block" href="/zamowienia">
          Moje konto
        </a>

        <a className="hidden whitespace-nowrap bg-transparent text-[13px] text-[#26364a] transition-all hover:text-clingo-blue md:flex" href="/home#jak-to-dziala">
          Dla Wykonawców
        </a>
      </div>
    </header>
  );
}
