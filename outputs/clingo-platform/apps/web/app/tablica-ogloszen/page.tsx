import { BoardInteractiveView } from "../../components/board-interactive-view";
import { PublicShell } from "../../components/public-shell";
import { getBoard } from "../../lib/api";
import { getHomepageSearchMarkup } from "../../lib/homepage-search-markup";

export default async function BoardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const read = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  const board = await getBoard();

  return (
    <PublicShell>
      <BoardInteractiveView board={board} searchMarkup={getHomepageSearchMarkup()} initialRequest={{
        service: read("service"),
        area: read("area"),
        address: read("address") || read("location"),
        addons: read("addons")
      }} initialPage={Number(read("page")) || 1} />
    </PublicShell>
  );
}
