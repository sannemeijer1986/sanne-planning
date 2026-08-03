import type { NextRequest } from "next/server";

// Uses Web Crypto (not node:crypto) so this module works both in API routes
// (Node runtime) and in middleware (Edge runtime).

export const AUTH_COOKIE_NAME = "sanne_edit_session";
export const VIEW_COOKIE_NAME = "sanne_view_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const AUTH_COOKIE_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bufferToHex(signature);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function createToken(purpose: string): Promise<string> {
  const payload = `${purpose}:${Date.now() + SESSION_DURATION_MS}`;
  return `${payload}.${await sign(payload)}`;
}

async function verifyToken(purpose: string, token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, await sign(payload))) return false;
  const [tokenPurpose, expiresStr] = payload.split(":");
  if (tokenPurpose !== purpose) return false;
  const expires = Number(expiresStr);
  return Number.isFinite(expires) && Date.now() <= expires;
}

export function createSessionToken(): Promise<string> {
  return createToken("edit");
}

export function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  return verifyToken("edit", token);
}

export function createViewSessionToken(): Promise<string> {
  return createToken("view");
}

export function verifyViewSessionToken(token: string | undefined | null): Promise<boolean> {
  return verifyToken("view", token);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.EDIT_PASSWORD;
  if (!expected || !password) return false;
  return safeEqual(password, expected);
}

export function checkViewPassword(password: string): boolean {
  const expected = process.env.VIEW_PASSWORD;
  if (!expected || !password) return false;
  return safeEqual(password, expected);
}

export async function isAuthorized(request: NextRequest): Promise<boolean> {
  return verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
}

export async function isViewAuthorized(request: NextRequest): Promise<boolean> {
  return verifyViewSessionToken(request.cookies.get(VIEW_COOKIE_NAME)?.value);
}
