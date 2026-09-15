import { NextRequest, NextResponse } from "next/server";
import { getBoard } from "../../../../lib/api";
import { searchProviders } from "../../../../lib/provider-search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query || query.length > 100) return NextResponse.json([]);

  try {
    const board = await getBoard();
    return NextResponse.json(searchProviders(board.listings, query));
  } catch {
    return NextResponse.json({ message: "Nie udało się wyszukać wykonawców." }, { status: 503 });
  }
}
