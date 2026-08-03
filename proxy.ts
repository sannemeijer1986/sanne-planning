import { NextRequest, NextResponse } from "next/server";
import { isViewAuthorized } from "@/lib/auth";

// Reachable without the view-session cookie: the lock page itself and the
// endpoint it posts the password to.
const PUBLIC_PATHS = new Set(["/lock", "/api/auth/view-login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (await isViewAuthorized(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/lock", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
