import { BoardInteractiveView } from "../../components/board-interactive-view";
import { PublicShell } from "../../components/public-shell";
import { getBoard } from "../../lib/api";

export default async function BoardPage() {
  const board = await getBoard();

  return (
    <PublicShell>
      <BoardInteractiveView board={board} />
    </PublicShell>
  );
}
