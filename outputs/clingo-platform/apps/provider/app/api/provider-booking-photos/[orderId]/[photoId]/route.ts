import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string; photoId: string }> }) {
  const { orderId, photoId } = await params;
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (![orderId, photoId].every(id => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))) return new NextResponse(null, { status: 404, headers });
  const token = request.cookies.get("clingo-provider-session")?.value;
  if (!token) return new NextResponse(null, { status: 401, headers });
  try {
    const response = await fetch(`${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/provider/bookings/${orderId}/photos/${photoId}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) return new NextResponse(null, { status: response.status, headers });
    return new NextResponse(response.body, { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch { return new NextResponse(null, { status: 503, headers }); }
}
