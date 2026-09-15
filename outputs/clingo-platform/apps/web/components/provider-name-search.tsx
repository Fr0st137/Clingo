"use client";

import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type ProviderSearchResult = {
  id: string;
  provider: string;
};

type ProviderNameSearchProps = {
  className: string;
  inputId: string;
  onNavigate?: () => void;
};

export function ProviderNameSearch({ className, inputId, onNavigate }: ProviderNameSearchProps) {
  const router = useRouter();
  const root = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProviderSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      setResults([]);
      setStatus("idle");
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      setIsOpen(true);
      try {
        const response = await fetch(`/api/providers/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const matches = await response.json() as ProviderSearchResult[];
        setResults(matches);
        setActiveIndex(matches.length ? 0 : -1);
        setStatus(matches.length ? "idle" : "empty");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setActiveIndex(-1);
          setStatus("error");
        }
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function openProfile(result: ProviderSearchResult) {
    setIsOpen(false);
    onNavigate?.();
    router.push(`/wykonawcy/${encodeURIComponent(result.id)}`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    const selected = results[activeIndex] ?? results[0];
    if (selected) openProfile(selected);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.min(results.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const message = status === "loading"
    ? "Szukam wykonawców…"
    : status === "empty"
      ? "Nie znaleziono takiego wykonawcy."
      : status === "error"
        ? "Wyszukiwanie jest chwilowo niedostępne."
        : "";

  return (
    <form className={`${className} relative`} onSubmit={submit} ref={root} role="search">
      <label className="header-not-login__search-label" htmlFor={inputId}>Szukaj wykonawcy</label>
      <span className="header-not-login__search-icon" aria-hidden="true">
        <img src="/clingo-homepage/assets/icons/header-search.svg" alt="" width={14} height={14} />
      </span>
      <input
        aria-activedescendant={activeIndex >= 0 ? `${inputId}-result-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={`${inputId}-results`}
        aria-expanded={isOpen}
        autoComplete="off"
        className="header-not-login__search-input"
        id={inputId}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => query.trim() && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Imię i nazwisko | Nazwa firmy"
        role="combobox"
        type="search"
        value={query}
      />

      {isOpen ? (
        <div
          className="absolute left-0 top-[calc(100%+10px)] z-[80] w-full overflow-hidden rounded-[18px] border border-[#e6edf3] bg-white py-2 shadow-[0_14px_35px_rgba(35,77,126,0.18)]"
          id={`${inputId}-results`}
          role="listbox"
        >
          {results.map((result, index) => (
            <button
              aria-selected={index === activeIndex}
              className={`block w-full border-0 px-5 py-3 text-left text-[14px] font-medium text-[#2e3b4c] hover:bg-[#f4f8fc] ${index === activeIndex ? "bg-[#f4f8fc]" : "bg-white"}`}
              id={`${inputId}-result-${index}`}
              key={result.id}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => openProfile(result)}
              role="option"
              type="button"
            >
              {result.provider}
            </button>
          ))}
          {message ? <p className="m-0 px-5 py-3 text-[13px] text-[#7c8691]">{message}</p> : null}
        </div>
      ) : null}
    </form>
  );
}
