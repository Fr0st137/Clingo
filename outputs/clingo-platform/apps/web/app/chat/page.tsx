import { ChatView } from "../../components/chat-view";
import { DashboardShell } from "../../components/dashboard-shell";

export default function ChatPage() {
  return (
    <DashboardShell active="Chat">
      <section className="w-full md:w-[1090px]">
        <ChatView />
      </section>
    </DashboardShell>
  );
}
