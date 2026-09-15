import { NextRequest, NextResponse } from "next/server";
import { proxyAccount } from "../../../../lib/account-proxy";

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  const method = request.method;
  let target: string | undefined;
  if (path === "profile" && ["GET", "PATCH"].includes(method)) target = "/auth/profile";
  if (path === "password" && method === "POST") target = "/auth/password";
  if (path === "notifications" && method === "PATCH") target = "/auth/notifications";
  if (path === "favorites" && method === "GET") target = "/dashboard/favorites";
  if (/^favorites\/[a-zA-Z0-9-]{1,150}$/.test(path) && ["PUT", "DELETE"].includes(method)) target = `/dashboard/${path}`;
  if (/^reviews\/[a-f0-9-]{36}$/.test(path) && ["PUT", "DELETE"].includes(method)) target = `/dashboard/${path}`;
  if (/^review-images\/[a-f0-9-]{36}$/.test(path) && method === "GET") target = `/dashboard/${path}`;
  if (!target) return new NextResponse(null, { status: 404 });
  return proxyAccount(request, target, true, path.startsWith("reviews/") ? 9 * 1024 * 1024 : 16384);
}
export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
