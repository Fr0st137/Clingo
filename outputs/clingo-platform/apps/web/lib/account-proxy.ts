import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function proxyAccount(request: NextRequest, path: string, authenticated = true, limit = 16384) {
  const mutating = request.method !== "GET";
  // Cookie-based requests must originate from this site. Direct API clients use bearer tokens.
  if (mutating && (request.headers.get("origin") !== request.nextUrl.origin || request.headers.get("sec-fetch-site") === "cross-site")) {
    return NextResponse.json({ message: "Niedozwolone źródło żądania." }, { status: 403 });
  }
  const token = request.cookies.get("clingo-session")?.value;
  if (authenticated && !token) return NextResponse.json({ message: "Zaloguj się ponownie." }, { status: 401 });
  let body: string | undefined;
  if (mutating) {
    if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ message: "Wymagany formularz JSON." }, { status: 415 });
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return NextResponse.json({ message: "Dane są zbyt duże." }, { status: 413 }); }
      chunks.push(value);
    }
    body = Buffer.concat(chunks).toString("utf8");
    try { JSON.parse(body); } catch { return NextResponse.json({ message: "Nieprawidłowe dane." }, { status: 400 }); }
  }
  if (["/auth/verify-email", "/auth/resend-verification", "/auth/verification-status"].includes(path)) {
    const verificationToken = request.cookies.get("clingo-verification")?.value;
    if (!verificationToken) return NextResponse.json({ message: "Sesja aktywacji wygasła. Zaloguj się ponownie." }, { status: 401 });
    body = JSON.stringify({ ...JSON.parse(body ?? "{}"), verificationToken });
  }
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${path}`, {
      method: request.method, headers: { "Content-Type": "application/json", ...(authenticated ? { Authorization: `Bearer ${token}` } : {}) },
      body, cache: "no-store", signal: AbortSignal.timeout(30000)
    });
    if (response.headers.get("content-type")?.startsWith("image/")) {
      return new NextResponse(await response.arrayBuffer(), { status: response.status, headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
    }
    const data = await response.json();
    const { token: newToken, verificationToken: pendingToken, ...rest } = Array.isArray(data) ? {} : data;
    const payload = Array.isArray(data) ? data : rest;
    const result = NextResponse.json(payload, { status: response.status, headers: { "Cache-Control": "private, no-store" } });
    const output = result;
    if (response.ok && mutating && path.startsWith("/dashboard/reviews/")) {
      revalidateTag("catalogue");
      revalidatePath("/opinie");
    }
    const verificationCookie = { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax" as const, path: "/" };
    if (response.ok && typeof pendingToken === "string") {
      output.cookies.set("clingo-verification", pendingToken, { ...verificationCookie, maxAge: 86400 });
      for (const name of ["clingo-session", "clingo-auth", "clingo-user-email"]) output.cookies.set(name, "", { ...verificationCookie, httpOnly: name === "clingo-session", maxAge: 0 });
    }
    if (response.ok && newToken) {
      output.cookies.set("clingo-verification", "", { ...verificationCookie, maxAge: 0 });
      if (data.user?.email) {
        output.cookies.set("clingo-auth", "1", { ...verificationCookie, httpOnly: false, maxAge: 2592000 });
        output.cookies.set("clingo-user-email", encodeURIComponent(data.user.email), { ...verificationCookie, httpOnly: false, maxAge: 2592000 });
      }
    }
    if (response.ok && newToken) output.cookies.set("clingo-session", newToken, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 2592000 });
    if (path === "/auth/logout" && (response.ok || response.status === 401)) {
      for (const name of ["clingo-session", "clingo-auth", "clingo-user-email", "clingo-verification"]) output.cookies.set(name, "", { httpOnly: name === "clingo-session" || name === "clingo-verification", sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 0 });
    }
    return output;
  } catch {
    return NextResponse.json({ message: "Nie można połączyć się z serwerem. Spróbuj ponownie." }, { status: 503 });
  }
}
