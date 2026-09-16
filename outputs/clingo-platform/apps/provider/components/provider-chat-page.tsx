import { ProviderShell } from "./provider-shell";

const chatAsset = (name: string) => `/figma-assets/chat/${name}`;

const conversations = [
  { name: "Anita Kowalska", preview: "Dzień dobry, chciałbym popro...", time: "2 godz." },
  { name: "Kajetan Mrówczyński", preview: "Ty: Dziękuję.", time: "6 godz." },
  { name: "Elżbieta Antkowiak", preview: "Do zobaczenia, pokaże Pani n...", time: "1 dzień" },
  { name: "Jolanta Bartusiak", preview: "Pod antresolą", time: "1 dzień", avatar: "client-avatar-jolanta.png" },
  { name: "Aleksander Twarościak", preview: "Ty: Nie ma żadnego problemu", time: "2 dni" },
  { name: "Magdalena wójcik", preview: "Pozdrawiam", time: "3 dni" },
  { name: "Michał Trybulec", preview: "Dzień dobry, chciałbym poprosić", time: "3 dni" },
  { name: "Maryla Kacprowska", preview: "Ty: Zatem do zobaczenia", time: "4 dzień" },
  { name: "Elżbieta Karaś", preview: "Nie ma żadnego problemu, pozdr...", time: "4 dni" },
  { name: "Radosław Myszor", preview: "Ty: Dziękuję.", time: "4 dzień" }
] as const;

const messages = [
  { side: "client", text: "Dzień dobry. Nie będę mogła być na miejscu, więc klucze mogę zostawić w skrzynce na listy, kod to 5284." },
  { side: "provider", text: "Dzień dobry Panie Michale 🙂\nDziękuję za złożenie zamówienia. Chciałabym dopytać o kwestię przekazania kluczy do mieszkania. Czy będzie Pani obecna w dniu sprzątania, czy klucze będą pozostawione w umówionym miejscu?" },
  { side: "client", text: "Dzień dobry. Nie będę mogła być na miejscu, więc klucze mogę zostawić w skrzynce na listy, kod to 5284." },
  { side: "provider", text: "Dziękuję za informację. Po zakończeniu sprzątania mogę odłożyć klucze w to samo miejsce, zamykając skrzynkę. Czy tak będzie w porządku?" },
  { side: "client", text: "Tak, jak najbardziej. Proszę tylko pamiętać, żeby dobrze przekręcić zamek, czasami się zacina." },
  { side: "provider", text: "Jasne, dziękuję za wskazówkę 😊\nSprzątanie wykonam zgodnie z zamówieniem w czwartek o 16:00. Po zakończeniu wyślę krótką wiadomość potwierdzającą odbiór kluczy." },
  { side: "client", text: "Świetnie, bardzo dziękuję za kontakt i do usłyszenia po sprzątaniu!" },
  { side: "client", text: "Tak, jak najbardziej. Proszę tylko pamiętać, żeby dobrze przekręcić zamek, czasami się zacina." },
  { side: "client", text: "Dzień dobry. Nie będę mogła być na miejscu, więc klucze mogę zostawić w skrzynce na listy, kod to 5284." },
  { side: "provider", text: "Jasne, dziękuję za wskazówkę 😊\nSprzątanie wykonam zgodnie z zamówieniem w czwartek o 16:00. Po zakończeniu wyślę krótką wiadomość potwierdzającą odbiór kluczy." }
] as const;

function ConversationPanel() {
  return (
    <section className="conversation-panel" aria-label="Rozmowa z Anitą Kowalską">
      <header className="conversation-header">
        <img src={chatAsset("client-avatar.png")} alt="" />
        <strong>Anita Kowalska</strong>
      </header>
      <div className="messages-viewport">
        <div className="messages-list">
          {messages.map((message, index) => (
            <div className={`message-row is-${message.side}`} key={index}>
              {message.side === "client" ? <img src={chatAsset("client-avatar.png")} alt="" /> : null}
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <div className="chat-scrollbar" aria-hidden="true"><i /></div>
      </div>
      <div className="message-composer">
        <img src={chatAsset("add-image.svg")} alt="Dodaj obraz" />
        <div className="message-input"><span>Aa</span><img src={chatAsset("smile.svg")} alt="Emoji" /></div>
        <img src={chatAsset("send.svg")} alt="Wyślij" />
      </div>
    </section>
  );
}

function ConversationList() {
  return (
    <aside className="conversation-list" aria-label="Lista rozmów">
      <div className="conversation-search"><img src={chatAsset("search.svg")} alt="" /><span>Szukaj klientów</span></div>
      <div className="conversation-list-body">
        <div className="conversation-cards">
          {conversations.map(conversation => (
            <article className="conversation-card" key={conversation.name}>
              <img src={chatAsset("avatar" in conversation ? conversation.avatar : "client-avatar.png")} alt="" />
              <div>
                <strong>{conversation.name}</strong>
                <p>{conversation.preview} <b>·</b> {conversation.time}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="list-scrollbar" aria-hidden="true"><i /></div>
      </div>
    </aside>
  );
}

export function ProviderChatPage() {
  return (
    <ProviderShell active="Chat" figmaNode="2173:2149">
      <div className="chat-content"><ConversationPanel /><ConversationList /></div>
    </ProviderShell>
  );
}
