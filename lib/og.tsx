import { ImageResponse } from "next/og";
import { site } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Shared OG card. next/og renders through Satori, which supports **flexbox only**
 * — no CSS grid — and caps the whole bundle (JSX + CSS + fonts) at 500 KB.
 * Deliberately fontless: Satori falls back to its built-in font, which keeps the
 * bundle small and avoids shipping a .ttf just for social cards. next/font emits
 * woff2, which ImageResponse does not accept.
 */
export function ogCard({ title, eyebrow }: { title: string; eyebrow: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0c10",
          padding: "72px 80px",
          border: "1px solid #222a34",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#7ee787" }}>
          {eyebrow}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 62 : 76,
            color: "#e6edf3",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", fontSize: 30 }}>
          <span style={{ color: "#7ee787" }}>&gt;</span>
          <span style={{ color: "#c9d1d9", marginLeft: 14 }}>{site.domain}</span>
          <span style={{ color: "#7d8590", marginLeft: "auto" }}>{site.role}</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
