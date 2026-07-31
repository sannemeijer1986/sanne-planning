import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "sanne_edit_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const AUTH_COOKIE_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSessionToken(): string {
  const payload = String(Date.now() + SESSION_DURATION_MS);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() <= expires;
}

export function checkPassword(password: string): boolean {
  const expected = process.env.EDIT_PASSWORD;
  if (!expected || !password) return false;
  return safeEqual(password, expected);
}

export function isAuthorized(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
}
