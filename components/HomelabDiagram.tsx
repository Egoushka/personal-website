/**
 * Homelab topology, hand-authored SVG.
 *
 * Not Mermaid: the only maintained build-time renderer drives headless Playwright,
 * which means a browser download in CI for one diagram. This is inline SVG, so it
 * costs nothing at runtime, themes with the rest of the site via currentColor and
 * CSS variables, and stays crisp at any zoom.
 *
 * Accessibility: role="img" with a <title>/<desc> pair, plus a visually-hidden
 * text equivalent, so it is not just a picture of information.
 */
export default function HomelabDiagram() {
  const box = (x: number, y: number, w: number, h: number, label: string, sub?: string) => (
    <g key={`${x}-${y}-${label}`}>
      <rect x={x} y={y} width={w} height={h} rx="8" className="dg-box" />
      <text x={x + w / 2} y={sub ? y + h / 2 - 4 : y + h / 2 + 4} className="dg-label">
        {label}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 13} className="dg-sub">
          {sub}
        </text>
      )}
    </g>
  );

  return (
    <figure className="diagram">
      <svg
        viewBox="0 0 700 430"
        role="img"
        aria-labelledby="dg-title dg-desc"
        className="dg"
      >
        <title id="dg-title">Two trust boundaries between a visitor and the files</title>
        <desc id="dg-desc">
          A request crosses two separate trust boundaries. Cloudflare terminates TLS
          and decides which crawlers get through; Traefik on the VPS terminates a
          second time and routes by Host header. Behind it, Caddy serves static files
          and Umami records analytics from the same origin, so no third-party request
          leaves the visitor&apos;s browser. Nothing behind Traefik is reachable from the
          internet — administration happens over a private mesh network instead.
        </desc>

        {/* Ports are deliberately absent: which port Umami listens on is a
            deployment detail, and the two boundaries are the actual idea. */}
        {box(270, 8, 160, 40, "Visitor")}
        {box(270, 84, 160, 50, "Cloudflare", "TLS, AI crawl control")}
        {box(270, 176, 160, 50, "Traefik", "TLS again, routes by Host")}

        {box(60, 286, 180, 52, "Caddy", "static files")}
        {box(460, 286, 180, 52, "Umami", "first-party analytics")}
        {box(270, 364, 160, 40, "Postgres", "reachable only by Umami")}

        {/* The two boundaries are the point of the diagram. */}
        <g className="dg-zone">
          <line x1="20" y1="62" x2="680" y2="62" />
          <line x1="20" y1="154" x2="680" y2="154" />
        </g>
        <text x="20" y="56" className="dg-zone-label">public internet</text>
        <text x="20" y="148" className="dg-zone-label">cloudflare edge</text>
        <text x="20" y="248" className="dg-zone-label">one hetzner box, private network</text>

        {/*
          The request path a visitor actually takes is the one accented stroke on
          the page — visitor → Cloudflare → Traefik → Caddy. Everything else is
          internal plumbing and stays in --border-strong.
        */}
        <g className="dg-line dg-traffic">
          <path d="M350 48 L350 84" markerEnd="url(#dg-arrow-accent)" />
          <path d="M350 134 L350 176" markerEnd="url(#dg-arrow-accent)" />
          <path d="M310 226 L310 256 L150 256 L150 286" markerEnd="url(#dg-arrow-accent)" />
        </g>
        <g className="dg-line">
          <path d="M390 226 L390 256 L550 256 L550 286" markerEnd="url(#dg-arrow)" />
          <path d="M550 338 L550 364 L430 364" markerEnd="url(#dg-arrow)" />
        </g>

        <text x="322" y="250" className="dg-edge">/</text>
        <text x="400" y="250" className="dg-edge">/s/script.js</text>

        <defs>
          <marker
            id="dg-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" className="dg-arrowhead" />
          </marker>
          {/* markers cannot inherit the referencing element's stroke, so the
              accented path needs its own arrowhead */}
          <marker
            id="dg-arrow-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" className="dg-arrowhead dg-arrowhead--accent" />
          </marker>
        </defs>
      </svg>

      <figcaption>
        Two boundaries, not one. TLS is terminated twice — once at Cloudflare, once
        at Traefik — which is why a header set in the wrong place silently disappears.
        Analytics is served from this origin rather than a third party, so blocking it
        blocks the site. Nothing behind Traefik answers the public internet.
      </figcaption>
    </figure>
  );
}
