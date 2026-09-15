import { NextRequest, NextResponse } from "next/server";
import { proxyAccount } from "../../../../lib/account-proxy";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  return proxyAccount(request, `/dashboard/review-images/${id}`, false);
}
