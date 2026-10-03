import { NextRequest, NextResponse } from "next/server";

const routes: Record<string, string[]> = {
  me: ["GET"], account: ["POST"], employees: ["GET", "POST"], clients: ["GET", "POST"],
  services: ["GET", "POST"], jobs: ["GET", "POST"], reviews: ["GET"], "multi-orders": ["GET"], "settings/location": ["GET", "PUT"],
  "settings/profile": ["GET", "PUT"], "settings/notifications": ["GET", "PUT"], "settings/password": ["POST"], "settings/export": ["GET"],
  "auth/login": ["POST"], "auth/register": ["POST"], "auth/logout": ["POST"]
};
async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const path = segments.join("/");
  const methods = routes[path] ?? (/^employees\/[a-f0-9-]{36}$/.test(path) ? ["GET", "PUT", "DELETE"] : /^(clients|services|jobs)\/[a-f0-9-]{36}$/.test(path) ? ["GET", "PUT"] : /^reviews\/[a-f0-9-]{36}\/report$/.test(path) || /^multi-orders\/[a-f0-9-]{36}\/action$/.test(path) ? ["PUT"] : []);
  if (!methods.includes(request.method)) return NextResponse.json({ message: "Nie znaleziono operacji." }, { status: 404 });
  const mutating = request.method !== "GET";
  if (mutating && (request.headers.get("origin") !== request.nextUrl.origin || request.headers.get("sec-fetch-site") === "cross-site")) return NextResponse.json({ message: "Niedozwolone źródło żądania." }, { status: 403 });
  const publicRoute = path === "auth/login" || path === "auth/register";
  const token = request.cookies.get("clingo-provider-session")?.value;
  if (!publicRoute && !token) return NextResponse.json({ message: "Zaloguj się do panelu wykonawcy." }, { status: 401 });
  let body: string | undefined;
  if (mutating) {
    if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ message: "Wymagany formularz JSON." }, { status: 415 });
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) { await reader.cancel(); return NextResponse.json({ message: "Formularz jest zbyt duży." }, { status: 413 }); }
      chunks.push(value);
    }
    body = Buffer.concat(chunks).toString("utf8");
    try { JSON.parse(body); } catch { return NextResponse.json({ message: "Nieprawidłowy formularz." }, { status: 400 }); }
  }
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/${path.startsWith("auth/") ? path : `provider/${path}`}`, {
      method: request.method, headers: { "Content-Type": "application/json", ...(!publicRoute ? { Authorization: `Bearer ${token}` } : {}) }, body, cache: "no-store", signal: AbortSignal.timeout(15000)
    });
    const data = await response.json();
    const { token: newToken, ...payload } = Array.isArray(data) ? {} : data;
    const output = NextResponse.json(Array.isArray(data) ? data : payload, { status: response.status, headers: { "Cache-Control": "private, no-store" } });
    const cookieOptions = { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax" as const, path: "/" };
    if (response.ok && typeof newToken === "string") output.cookies.set("clingo-provider-session", newToken, { ...cookieOptions, maxAge: 2592000 });
    if ((!publicRoute && response.status === 401) || (path === "auth/logout" && response.ok)) output.cookies.set("clingo-provider-session", "", { ...cookieOptions, maxAge: 0 });
    return output;
  } catch { return NextResponse.json({ message: "Serwer jest niedostępny. Spróbuj ponownie.", }, { status: 503 }); }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };

