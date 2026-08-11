import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { site } from "@/lib/site";

// Required under output: "export" — without it the build fails with
// "export const dynamic ... not configured on route".
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${site.name} — ${site.role}`;

export default function Image() {
  return ogCard({ eyebrow: site.role, title: site.greeting });
}
