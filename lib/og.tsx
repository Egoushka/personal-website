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
 *
 * Colours are the dark theme's tokens, hard-coded — a card is rendered once at
 * build time and has no access to the stylesheet. Keep them in step with
 * globals.css by hand; there is no way to derive them here.
 */
const PAPER = "#0A0B0D";
const INK = "#F2F4F6";
const INK_2 = "#98A0A8";
const RULE = "#1E2126";
const ACCENT = "#F2A03D";

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
          background: PAPER,
          padding: "72px 80px",
          border: `1px solid ${RULE}`,
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: ACCENT }}>
          {eyebrow}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 62 : 76,
            color: INK,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", fontSize: 30 }}>
          <span style={{ color: INK }}>{site.domain}</span>
          <span style={{ color: INK_2, marginLeft: "auto" }}>{site.role}</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
