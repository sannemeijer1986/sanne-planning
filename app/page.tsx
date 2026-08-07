import Timeline from "@/components/Timeline/Timeline";

// This is a private, per-request planning tool, not shareable static content.
// Without this, Next prerenders the page once at build time and Vercel serves
// that snapshot from cache indefinitely, so the client never gets a fresh
// enough server render to hydrate correctly against - "Today" (and every
// other interaction) freezes at whatever date the last deploy happened to be.
export const dynamic = "force-dynamic";

export default function Home() {
  return <Timeline />;
}
