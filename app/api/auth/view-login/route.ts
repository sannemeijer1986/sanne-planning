import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  VIEW_COOKIE_NAME,
  checkViewPassword,
  createViewSessionToken,
} from "@/lib/auth";
import { checkRateLimit, recordAttempt } from "@/lib/rateLimit";

const SCOPE = "view-login";

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, SCOPE);
  if (rateLimit.blocked) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!checkViewPassword(password)) {
    recordAttempt(request, SCOPE, false);
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  recordAttempt(request, SCOPE, true);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(VIEW_COOKIE_NAME, await createViewSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
