import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const target = new URL("/login", process.env.PROVIDER_URL ?? "http://localhost:3001");
  target.searchParams.set("next", "/orders");
  if (request.nextUrl.searchParams.get("mode") === "register") target.searchParams.set("mode", "register");
  return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
}
