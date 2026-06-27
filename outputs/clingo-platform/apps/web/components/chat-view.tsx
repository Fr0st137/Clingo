"use client";

import { ImagePlus, Search, SendHorizonal, Smile } from "lucide-react";
import { useMemo, useState } from "react";

const messages = [
  {
    side: "mine",
    text: "Dziękuję za złożenie zamówienia. Chciałabym dopytać o kwestię przekazania kluczy do mieszkania. Czy będzie Pani obecna w dniu sprzątania, czy klucze będą pozostawione w umówionym miejscu?"
  },
  {
    side: "theirs",
    text: "Dzień dobry. Nie będę mogła być na miejscu, więc klucze mogę zostawić w skrzynce na listy, kod to 5284."
  },
  {
    side: "mine",
    text: "Dziękuję za informację. Po zakończeniu sprzątania mogę odłożyć klucze w to samo miejsce, zamykając skrzynkę. Czy tak będzie w porządku?"
  },
  {
    side: "theirs",
    text: "Tak, jak najbardziej. Proszę tylko pamiętać, żeby dobrze przekręcić zamek, czasami się zacina."
  },
  {
    side: "mine",
    text: "Jasne, dziękuję za wskazówkę 🙂 Sprzątanie wykonam zgodnie z zamówieniem w czwartek o 16:00. Po zakończeniu wyślę krótką wiadomość potwierdzającą odbiór kluczy."
  },
  { side: "theirs", text: "Świetnie, bardzo dziękuję za kontakt." },
  {
    side: "theirs",
    text: "Tak, jak najbardziej. Proszę tylko pamiętać, żeby dobrze przekręcić zamek, czasami się zacina."
  },
  {
    side: "theirs",
    text: "Dzień dobry. Nie będę mogła być na miejscu, więc klucze mogę zostawić w skrzynce na listy, kod to 5284."
  },
  {
    side: "mine",
    text: "Jasne, dziękuję za wskazówkę 🙂 Sprzątanie wykonam zgodnie z zamówieniem w czwartek o 16:00. Po zakończeniu wyślę krótką wiadomość potwierdzającą odbiór kluczy."
  }
];

const contacts = [
  ["Anita Kowalska", "Dzień dobry, chciałbym popro...", "2 godz."],
  ["Kajetan Mrowczyński", "Ty: Dziękuję.", "6 godz."],
  ["Elżbieta Antkowiak", "Do zobaczenia, pokaże Pani n...", "1 dzień"],
  ["Jolanta Bartusiak", "Pod antresolą", "1 tydzień"],
  ["Aleksander Twarowski", "Ty: Nie ma żadnego problemu.", "2 dni"],
  ["Magdalena wójcik", "Pozdrawiam", "3 dni"],
  ["Michał Trybulec", "Dzień dobry, chciałbym poprosić", "3 dni"],
  ["Maryla Kacprowska", "Ty: Zatem do zobaczenia", "4 dzień"]
];

function PersonAvatar({ photo = false }: { photo?: boolean }) {
  return (
    <div
      className={[
        "h-[40px] w-[40px] rounded-full",
        photo
          ? "bg-[radial-gradient(circle_at_55%_33%,#3a2a22_0_14%,transparent_15%),radial-gradient(circle_at_50%_76%,#e8bd96_0_33%,transparent_34%),linear-gradient(135deg,#d7edff,#fff1df)]"
          : "bg-[radial-gradient(circle_at_50%_34%,#8f98a3_0_18%,transparent_19%),radial-gradient(circle_at_50%_76%,#8f98a3_0_32%,transparent_33%),#eef2f7]"
      ].join(" ")}
    />
  );
}

export function ChatView() {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredContacts = useMemo(
    () => contacts.filter(([name]) => name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  return (
    <section className="grid w-full gap-5 md:w-[1090px] md:grid-cols-[715px_350px]">
      <div className="h-[620px] overflow-hidden rounded-xl border border-[#dce6f2] bg-white shadow-figma md:h-[720px]">
        <header className="flex h-[60px] items-center gap-[10px] border-b border-[#e3ebf4] px-[10px]">
          <PersonAvatar />
          <strong className="text-[13px] text-clingo-ink">Anita Kowalska</strong>
        </header>

        <div className="relative h-[483px] overflow-hidden border-b border-[#e3ebf4] px-[15px] py-[13px] md:h-[583px]">
          <div className="absolute right-[6px] top-[18px] h-[520px] w-[7px] rounded-full bg-[#8090a4]" />
          <div className="space-y-[10px] pr-[18px]">
            {messages.map((message, index) => (
              <div
                className={[
                  "flex items-start gap-[10px]",
                  message.side === "mine" ? "justify-end" : "justify-start"
                ].join(" ")}
                key={`${message.side}-${index}`}
              >
                {message.side === "theirs" ? <PersonAvatar /> : null}
                <p
                  className={[
                    "max-w-[82%] rounded-xl px-[10px] py-[9px] text-[12px] leading-[16px] md:max-w-[480px]",
                    message.side === "mine"
                      ? "bg-clingo-blue text-white"
                      : "bg-[#f1f4f8] text-[#304056]"
                  ].join(" ")}
                >
                  {message.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <footer className="flex h-[77px] items-center gap-[10px] px-[15px]">
          <button className="grid h-[28px] w-[28px] place-items-center text-[#7d8da1]">
            <ImagePlus className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
          <label className="flex h-[32px] flex-1 items-center rounded-full border border-[#dfe8f2] bg-white px-[12px]">
            <input className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#8a98aa]" placeholder="Aa" />
            <Smile className="h-[15px] w-[15px] text-[#8796a8]" strokeWidth={1.8} />
          </label>
          <button className="grid h-[32px] w-[32px] place-items-center text-[#718198]">
            <SendHorizonal className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>
        </footer>
      </div>

      <aside className="h-[420px] overflow-hidden md:h-[720px]">
        <label className="mb-[10px] flex h-[38px] items-center gap-[10px] rounded-xl border border-[#dfe8f2] bg-white px-[14px] shadow-soft transition-all focus-within:border-clingo-blue md:rounded-full">
          <Search className="h-[15px] w-[15px] text-[#7f8fa3]" strokeWidth={1.8} />
          <input
            className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#7f8fa3]"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Szukaj Wykonawców"
            value={searchQuery}
          />
        </label>

        <div className="relative space-y-[10px] pr-[19px]">
          <div className="absolute right-0 top-0 h-[720px] w-[7px] rounded-full bg-[#8796a8]" />
          {filteredContacts.map(([name, preview, time], index) => (
            <article
              className="flex h-[58px] items-center gap-[12px] rounded-xl border border-[#e2ebf5] bg-white px-[12px] shadow-soft transition-all hover:-translate-y-0.5 hover:border-clingo-blue"
              key={name}
            >
              <PersonAvatar photo={index === 3} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-bold leading-[15px] text-clingo-ink">{name}</h3>
                <p className="mt-[4px] truncate text-[11px] leading-[13px] text-clingo-muted">
                  {preview} · {time}
                </p>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}
