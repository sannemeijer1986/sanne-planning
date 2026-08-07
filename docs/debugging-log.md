# Debugging log

Record of non-obvious bugs and their root causes, so future sessions don't
have to re-derive them from scratch. Newest entries first. Add a new `##`
entry whenever a bug takes more than a quick glance at the code to solve.

## 2026-08-07 — Today marker stuck on a past date, whole page non-interactive

**Symptom:** The vertical "Today" line on the timeline was stuck on Tuesday
Aug 4 while the real date was Friday Aug 7 — three days behind. A hard
refresh in the browser did not fix it.

**Investigation:**
- The code already had a prior fix for exactly this class of bug
  (`bb6e9c9`, "Fix stale Today marker when tab stays open past midnight" —
  `today` moved from a one-time `useMemo` to `useState` refreshed every 60s
  and on focus/visibilitychange). That fix was confirmed live in
  production via the Vercel MCP (`list_deployments` / `get_deployment`),
  so the regression was somewhere else.
- Used Puppeteer to load the live site directly and confirmed the browser's
  own `new Date()` was correct (Fri Aug 7). So the bug wasn't the client
  clock or the date-refresh logic itself.
- Clicking the "Today" scroll button did nothing (`scrollLeft` didn't
  change), and dispatching `focus`/`visibilitychange` events manually also
  did nothing. This proved the page wasn't just stale — **React was not
  hydrating at all**. The DOM was a frozen static snapshot.
- Fetched the page's own response headers from within the browser
  (`XMLHttpRequest` against `location.href`) and found the smoking gun:
  ```
  x-nextjs-prerender: 1
  x-vercel-cache: HIT
  age: 247309          (~2.9 days)
  ```

**Root cause:** `app/page.tsx` had no dynamic-rendering export, so Next.js
statically prerendered it once at build time. Vercel then served that one
cached HTML snapshot indefinitely (`x-vercel-cache: HIT`). With no new
deploys in ~3 days, the snapshot was 2.9 days stale, and the resulting
server/client date gap was large enough that hydration never cleanly took
over — freezing the *entire* page (not just the Today marker) as
non-interactive.

**Fix:** Added `export const dynamic = "force-dynamic";` to `app/page.tsx`
(commit `bf275eb`). This is a private, per-user planning tool, not
shareable static content — it should never have been cached as static in
the first place. Forcing per-request rendering removes both the staleness
and the server/client mismatch that broke hydration.

**Verification:** After the fix deployed, confirmed live via Puppeteer
that (a) the Today marker sits on the correct date, and (b) clicking
"Today" actually scrolls the view (`scrollLeft` changed from `0` to
`16995.5`), proving hydration/interactivity is genuinely working again —
not just a lucky one-time-correct server render.

**Lesson for next time:** If something on this app looks "stuck" (not
just the date — any state that should update but doesn't), check
`x-vercel-cache` / `x-nextjs-prerender` response headers before assuming
it's a client-side logic bug. Any route rendering the live planning UI
should stay dynamic; don't remove `force-dynamic` from `app/page.tsx`
without a good reason.
