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
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/dashboard/${paths[action]}`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(await request.json()), cache: "no-store"
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: "Nie udało się połączyć z serwerem. Twoje dane pozostały w formularzu. Spróbuj ponownie." }, { status: 503 });
  }
}
