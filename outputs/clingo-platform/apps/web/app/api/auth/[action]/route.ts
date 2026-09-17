import { NextRequest, NextResponse } from "next/server";
import { proxyAccount } from "../../../../lib/account-proxy";
export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!["lookup", "login", "register", "logout"].includes(action)) return NextResponse.json({ message: "Nie znaleziono." }, { status: 404 });
  return proxyAccount(request, `/auth/${action}`, action === "logout");
}
