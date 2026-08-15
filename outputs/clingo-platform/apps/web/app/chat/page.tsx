import { ChatView } from "../../components/chat-view";
import { DashboardShell } from "../../components/dashboard-shell";
import { getChat } from "../../lib/api";

export default async function ChatPage() {
  const chat = await getChat();

  return (
    <DashboardShell active="Chat">
      <section className="w-full md:w-[1090px]">
        <ChatView chat={chat} />
      </section>
    </DashboardShell>
  );
}
