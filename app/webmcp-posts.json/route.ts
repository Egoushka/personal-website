import { buildPosts } from "@/lib/webmcp";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(buildPosts()), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
