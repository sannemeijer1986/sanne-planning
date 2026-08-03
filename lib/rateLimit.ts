// Simple in-memory login-attempt limiter, keyed by client IP + scope.
// Lives in module scope so it persists across requests to the same warm
// serverless instance — not perfectly centralized across instances, but a
// meaningful deterrent for a low-traffic internal tool without adding a
// database just for this.

const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface Entry {
  count: number;
  windowStart: number;
  lockedUntil: number;
}

const attempts = new Map<string, Entry>();

function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : (request.headers.get("x-real-ip") ?? "unknown");
  return `${scope}:${ip}`;
}

export function checkRateLimit(
  request: Request,
  scope: string
): { blocked: boolean; retryAfterSeconds: number } {
  const entry = attempts.get(clientKey(request, scope));
  const now = Date.now();
  if (entry && entry.lockedUntil > now) {
    return { blocked: true, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  return { blocked: false, retryAfterSeconds: 0 };
}

export function recordAttempt(request: Request, scope: string, success: boolean): void {
  const key = clientKey(request, scope);
  if (success) {
    attempts.delete(key);
    return;
  }
  const now = Date.now();
  let entry = attempts.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { count: 0, windowStart: now, lockedUntil: 0 };
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
  attempts.set(key, entry);
}
