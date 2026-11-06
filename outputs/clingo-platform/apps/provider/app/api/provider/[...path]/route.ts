import { NextRequest, NextResponse } from "next/server";

const routes: Record<string, string[]> = {
  me: ["GET"], account: ["POST"], employees: ["GET", "POST"], clients: ["GET", "POST"], absences: ["GET", "POST"],
  services: ["GET", "POST"], jobs: ["GET", "POST"], "bookings/profiles": ["GET"], reviews: ["GET"], "multi-orders": ["GET", "POST"], "multi-orders/availability": ["POST"], "settings/location": ["GET", "PUT"],
  "settings/profile": ["GET", "PUT"], "settings/notifications": ["GET", "PUT"], "settings/password": ["POST"], "settings/export": ["GET"],
  "settings/staffing": ["GET", "PUT"],
  projects: ["GET"],
  "reviews/summary": ["GET"],
  "auth/verify-email": ["POST"], "auth/resend-verification": ["POST"], "auth/verification-status": ["POST"], "auth/login": ["POST"], "auth/register": ["POST"], "auth/logout": ["POST"]
};
async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const path = segments.join("/");
  const methods = routes[path] ?? (/^bookings\/[a-f0-9-]{36}\/reschedule-availability$/.test(path) ? ["POST"] : /^bookings\/[a-f0-9-]{36}\/reschedule$/.test(path) ? ["PUT"] : /^employees\/[a-f0-9-]{36}$/.test(path) ? ["GET", "PUT", "DELETE"] : /^(clients|services|jobs|bookings)\/[a-f0-9-]{36}$/.test(path) ? ["GET", "PUT"] : /^reviews\/[a-f0-9-]{36}\/report$/.test(path) || /^multi-orders\/[a-f0-9-]{36}\/action$/.test(path) ? ["PUT"] : []);
  const allowed = /^projects\/manual\/[a-f0-9-]{36}\/notes$/.test(path) ? ["GET","PUT"] : /^projects\/(booking|manual)\/[a-f0-9-]{36}\/(availability|complete)$/.test(path) ? ["POST"] : /^projects\/(booking|manual)\/[a-f0-9-]{36}$/.test(path) ? ["GET","PUT"] : /^bookings\/[a-f0-9-]{36}\/staffing$/.test(path) ? ["POST", "PUT"] : /^absences\/[a-f0-9-]{36}$/.test(path) ? ["PUT"] : methods;
  if (!allowed.includes(request.method)) return NextResponse.json({ message: "Nie znaleziono operacji." }, { status: 404 });
  const mutating = request.method !== "GET";
  if (mutating && (request.headers.get("origin") !== request.nextUrl.origin || request.headers.get("sec-fetch-site") === "cross-site")) return NextResponse.json({ message: "Niedozwolone źródło żądania." }, { status: 403 });
  const publicRoute = path.startsWith("auth/") && path !== "auth/logout";
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
      const limit = path === "multi-orders" || /^projects\/manual\/[a-f0-9-]{36}\/notes$/.test(path) ? 3 * 1024 * 1024 : /^projects\/(booking|manual)\/[a-f0-9-]{36}$/.test(path) ? 512 * 1024 : /^services\/[a-f0-9-]{36}$/.test(path) && request.method === "PUT" ? 3 * 1024 * 1024 : 16384;
      if (size > limit) { await reader.cancel(); return NextResponse.json({ message: "Formularz jest zbyt duży." }, { status: 413 }); }
      chunks.push(value);
    }
    body = Buffer.concat(chunks).toString("utf8");
    try { JSON.parse(body); } catch { return NextResponse.json({ message: "Nieprawidłowy formularz." }, { status: 400 }); }
  }
  if (["auth/verify-email", "auth/resend-verification", "auth/verification-status"].includes(path)) {
    const verificationToken = request.cookies.get("clingo-provider-verification")?.value;
    if (!verificationToken) return NextResponse.json({ message: "Sesja aktywacji wygasła. Zaloguj się ponownie." }, { status: 401 });
    body = JSON.stringify({ ...JSON.parse(body ?? "{}"), verificationToken });
  }
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/${path.startsWith("auth/") ? path : `provider/${path}`}`, {
      method: request.method, headers: { "Content-Type": "application/json", ...(!publicRoute ? { Authorization: `Bearer ${token}` } : {}) }, body, cache: "no-store", signal: AbortSignal.timeout(15000)
    });
    const data = await response.json();
    const { token: newToken, verificationToken: pendingToken, ...payload } = Array.isArray(data) ? {} : data;
    const output = NextResponse.json(Array.isArray(data) ? data : payload, { status: response.status, headers: { "Cache-Control": "private, no-store" } });
    const cookieOptions = { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax" as const, path: "/" };
    if (response.ok && typeof pendingToken === "string") {
      output.cookies.set("clingo-provider-verification", pendingToken, { ...cookieOptions, maxAge: 86400 });
      output.cookies.set("clingo-provider-session", "", { ...cookieOptions, maxAge: 0 });
    }
    if (response.ok && typeof newToken === "string") output.cookies.set("clingo-provider-verification", "", { ...cookieOptions, maxAge: 0 });
    if (response.ok && typeof newToken === "string") output.cookies.set("clingo-provider-session", newToken, { ...cookieOptions, maxAge: 2592000 });
    if ((!publicRoute && response.status === 401) || (path === "auth/logout" && response.ok)) output.cookies.set("clingo-provider-session", "", { ...cookieOptions, maxAge: 0 });
    return output;
  } catch { return NextResponse.json({ message: "Serwer jest niedostępny. Spróbuj ponownie.", }, { status: 503 }); }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };

