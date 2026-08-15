import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = [
  "/chat",
  "/opinie",
  "/regulaminy",
  "/standardy-uslug",
  "/ulubione",
  "/ustawienia",
  "/zamowienia",
  "/zamowienie"
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.get("clingo-auth")?.value === "1") {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/logowanie";
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/opinie/:path*",
    "/regulaminy/:path*",
    "/standardy-uslug/:path*",
    "/ulubione/:path*",
    "/ustawienia/:path*",
    "/zamowienia/:path*",
    "/zamowienie/:path*"
  ]
};
