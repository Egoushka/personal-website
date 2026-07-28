import { buildFeed } from "@/lib/feed";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildFeed().json1(), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
