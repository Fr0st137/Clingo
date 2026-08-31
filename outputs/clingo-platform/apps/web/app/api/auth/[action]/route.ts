import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!["lookup", "login", "register"].includes(action)) return NextResponse.json({ message: "Nie znaleziono." }, { status: 404 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/${action}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(await request.json()), cache: "no-store"
    });
    const { token, ...payload } = await response.json();
    const result = NextResponse.json(payload, { status: response.status });
    if (response.ok && token) {
      result.cookies.set("clingo-session", token, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 2592000 });
    }
    return result;
  } catch {
    return NextResponse.json({ message: "Nie można połączyć się z serwerem. Spróbuj ponownie." }, { status: 503 });
  }
}
