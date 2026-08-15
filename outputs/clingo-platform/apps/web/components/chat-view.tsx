"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

const chatAssets = {
  addImage: "/figma-assets/chat-add-image.svg",
  avatar: "/figma-assets/chat-avatar.png",
  scrollDown: "/figma-assets/chat-scroll-down.svg",
  scrollUp: "/figma-assets/chat-scroll-up.svg",
  send: "/figma-assets/chat-send.svg",
  smile: "/figma-assets/chat-smile.svg"
};

const sentGradient =
  "linear-gradient(175.451deg, rgba(0, 121, 222, 0.9) 17.981%, rgba(230, 237, 243, 0.9) 537.22%)";

export type ChatMessageData = {
  id: string;
  side: "mine" | "theirs";
  text: string;
};

export type ChatContactData = {
  id: string;
  name: string;
  preview: string;
  timeAgo: string;
};

export type ChatPayload = {
  contacts: ChatContactData[];
  messages: ChatMessageData[];
};

function Avatar({ size = 30 }: { size?: 30 | 40 }) {
  return (
    <div className="shrink-0 rounded-[9999px] border-0 border-[#e5e7eb]" style={{ height: size, width: size }}>
      <img alt="" className="h-full w-full rounded-[9999px]" src={chatAssets.avatar} />
    </div>
  );
}

function ContactAvatar({ photo }: { photo?: boolean }) {
  if (photo) {
    return (
      <div className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[9999px] bg-[radial-gradient(circle_at_55%_35%,#2e2723_0_17%,transparent_18%),radial-gradient(circle_at_50%_72%,#d7a783_0_32%,transparent_33%),linear-gradient(135deg,#efe4dc,#31201b)]" />
    );
  }

  return <Avatar size={40} />;
}

function MessageBubble({ index, message }: { index: number; message: ChatMessageData }) {
  const isMine = message.side === "mine";
  const width = index < 3 ? 588 : 480;
  const radius = index < 2 ? "rounded-[10px]" : "rounded-[20px]";
  const bubbleWidth = isMine ? width : width - 40;

  return (
    <div className={`flex w-full flex-col overflow-hidden ${isMine ? "items-end" : "items-start"}`}>
      <div className="flex items-start gap-[10px] overflow-hidden" style={{ width }}>
        {!isMine ? <Avatar /> : null}
        <div
          className={`flex items-start overflow-hidden p-[10px] ${radius}`}
          style={{
            background: isMine ? sentGradient : "#eef0f3",
            color: isMine ? "#ffffff" : "#2e3b4c",
            width: bubbleWidth
          }}
        >
          <p className="m-0 whitespace-pre-line break-words text-[14px] font-normal leading-[16px]">
            {message.text}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ChatView({ chat }: { chat: ChatPayload }) {
  const [searchQuery, setSearchQuery] = useState("");
  const activeContact = chat.contacts[0];
  const filteredContacts = useMemo(
    () => chat.contacts.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [chat.contacts, searchQuery]
  );

  return (
    <section className="grid w-full gap-[30px] md:w-[1090px] md:grid-cols-[715px_345px]">
      <div
        className="flex h-[720px] w-[715px] flex-col items-start rounded-[20px] border border-[#e5e7eb] bg-white drop-shadow-[0px_4px_7px_rgba(0,0,0,0.04)]"
        data-name="div"
        data-node-id="5248:8678"
      >
        <header className="flex w-full items-center gap-[10px] overflow-hidden border-b border-[#e5e7eb] p-[10px]">
          <Avatar size={40} />
          <div className="flex min-w-px flex-1 flex-col items-start overflow-hidden">
            <strong className="whitespace-nowrap text-[14px] font-semibold leading-[16px] text-[#2e3b4c]">
              {activeContact?.name ?? "Chat"}
            </strong>
          </div>
        </header>

        <div className="flex min-h-px w-full flex-1 items-start overflow-hidden pr-px">
          <div className="flex h-full min-w-px flex-1 flex-col justify-end gap-[10px] overflow-hidden px-[15px]">
            {chat.messages.map((message, index) => (
              <MessageBubble index={index} key={message.id} message={message} />
            ))}
          </div>

          <div className="flex h-full shrink-0 flex-col items-start overflow-hidden rounded-[30px] bg-[#f9fafb] px-[2px] py-[3px]">
            <img alt="" className="h-[12px] w-[12px] shrink-0" src={chatAssets.scrollUp} />
            <div className="min-h-px flex-1 w-[3px]" />
            <div className="flex items-center overflow-hidden px-[2px] py-[3px]">
              <div className="h-[270px] w-[8px] shrink-0 rounded-[15px] bg-[#7c8691]" />
            </div>
            <img alt="" className="h-[12px] w-[12px] shrink-0 rotate-180" src={chatAssets.scrollDown} />
          </div>
        </div>

        <footer className="flex w-full shrink-0 items-center justify-center gap-[20px] overflow-hidden rounded-b-[15px] p-[20px]">
          <img alt="" className="h-[22px] w-[22px] shrink-0" src={chatAssets.addImage} />
          <label className="flex min-w-px flex-1 flex-col items-start overflow-hidden">
            <span className="flex w-full shrink-0 items-center justify-between overflow-hidden rounded-[30px] border border-[#d9d9d9] bg-white p-[10px]">
              <input
                aria-label="Wiadomość"
                className="w-full bg-transparent text-[14px] font-normal leading-normal text-[#7c8691] outline-none placeholder:text-[#7c8691]"
                placeholder="Aa"
              />
              <img alt="" className="h-[16px] w-[16px] shrink-0" src={chatAssets.smile} />
            </span>
          </label>
          <img alt="" className="h-[22px] w-[22px] shrink-0" src={chatAssets.send} />
        </footer>
      </div>

      <aside className="relative h-[720px] w-[345px] overflow-hidden" data-name="List chat" data-node-id="5248:8752">
        <label className="mb-[16px] flex h-[33px] w-[345px] items-center gap-[11px] rounded-[30px] border border-[#d9dfe7] bg-white px-[12px] shadow-[0px_2px_8px_0px_rgba(15,23,42,0.05)]">
          <Search className="h-[16px] w-[16px] text-[#2e3b4c]" strokeWidth={1.8} />
          <input
            className="w-full bg-transparent text-[14px] font-normal leading-[17px] text-[#7c8691] outline-none placeholder:text-[#7c8691]"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Szukaj Wykonawców"
            value={searchQuery}
          />
        </label>

        <div className="relative space-y-[12px] pr-[31px]">
          <div className="absolute right-[3px] top-0 h-[672px] w-[16px] rounded-[30px] bg-[#f9fafb] px-[4px] py-[3px]">
            <div className="mt-[3px] h-[164px] w-[8px] rounded-[15px] bg-[#7c8691]" />
          </div>
          {filteredContacts.map((contact, index) => (
            <article
              className="flex h-[68px] w-[314px] items-center gap-[13px] rounded-[18px] border border-[#e5e7eb] bg-white px-[10px] shadow-[0px_2px_10px_0px_rgba(15,23,42,0.05)]"
              key={contact.id}
            >
              <ContactAvatar photo={index === 3} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-bold leading-[17px] text-[#2e3b4c]">{contact.name}</h3>
                <p className="mt-[5px] truncate text-[12px] font-normal leading-[15px] text-[#7c8691]">
                  {contact.preview} · {contact.timeAgo}
                </p>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}
