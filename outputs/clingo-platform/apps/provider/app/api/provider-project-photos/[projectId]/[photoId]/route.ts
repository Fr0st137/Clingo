import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string; photoId: string }> }) {
  const { projectId, photoId } = await params;
  const headers = { "Cache-Control": "private, no-store" };
  if (![projectId, photoId].every(id => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))) return new NextResponse(null, { status: 404, headers });
  const token = request.cookies.get("clingo-provider-session")?.value;
  if (!token) return new NextResponse(null, { status: 401, headers });
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/provider/projects/manual/${projectId}/photos/${photoId}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) return new NextResponse(null, { status: response.status, headers });
    return new NextResponse(response.body, { headers: { ...headers, "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff" } });
  } catch { return new NextResponse(null, { status: 503, headers }); }
}
