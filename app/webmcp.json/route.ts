import { buildManifest } from "@/lib/webmcp";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(buildManifest()), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
