import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const paths: Record<string, string> = {
    quote: "booking/quote",
    availability: "booking/availability",
    "multi-availability": "booking/multi-availability",
    "multi-schedule": "booking/multi-schedule",
    confirm: "orders"
  };
  if (!paths[action]) return new NextResponse(null, { status: 404 });
  const token = request.cookies.get("clingo-session")?.value;
  if (!token || request.cookies.get("clingo-auth")?.value !== "1") return NextResponse.json({ message: "Zaloguj się ponownie, aby kontynuować zamówienie." }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ message: "Wymagany formularz JSON." }, { status: 415 });
  try {
    const limit = action === "confirm" ? 3 * 1024 * 1024 : 16 * 1024;
    const reader = request.body?.getReader(), chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return NextResponse.json({ message: "Dane zamówienia są zbyt duże. Zmniejsz liczbę zdjęć." }, { status: 413 }); }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks).toString("utf8");
    try { JSON.parse(body); } catch { return NextResponse.json({ message: "Nieprawidłowe dane zamówienia." }, { status: 400 }); }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/dashboard/${paths[action]}`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body, cache: "no-store"
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: "Nie udało się połączyć z serwerem. Twoje dane pozostały w formularzu. Spróbuj ponownie." }, { status: 503 });
  }
}
