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
        <title id="dg-title">How traffic reaches hrabovskyi.online</title>
        <desc id="dg-desc">
          A visitor request passes through Cloudflare, then Traefik on the VPS, then
          an internal Caddy that serves the static files. Umami and other services
          sit on the same internal Docker network, reachable over the tailnet.
        </desc>

        {/* public path */}
        {box(270, 10, 160, 44, "Visitor")}
        {box(270, 92, 160, 52, "Cloudflare", "TLS · cache · WAF")}
        {box(270, 182, 160, 52, "Traefik", "edge router · :443")}

        {box(60, 292, 180, 56, "Caddy", "static files · :8090")}
        {box(460, 292, 180, 56, "Umami", "analytics · :3000")}
        {box(270, 372, 160, 44, "Postgres", "umami only")}

        {/* arrows */}
        <g className="dg-line">
          <path d="M350 54 L350 92" markerEnd="url(#dg-arrow)" />
          <path d="M350 144 L350 182" markerEnd="url(#dg-arrow)" />
          <path d="M310 234 L310 262 L150 262 L150 292" markerEnd="url(#dg-arrow)" />
          <path d="M390 234 L390 262 L550 262 L550 292" markerEnd="url(#dg-arrow)" />
          <path d="M550 348 L550 372 L430 372" markerEnd="url(#dg-arrow)" />
        </g>

        <text x="360" y="256" className="dg-edge">/</text>
        <text x="404" y="256" className="dg-edge">/s/script.js</text>

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
        </defs>
      </svg>

      <figcaption>
        Everything below Cloudflare runs on one Hetzner VPS. Caddy and Umami share a
        Docker network so Traefik can reach them by name; Postgres is reachable only
        by Umami.
      </figcaption>
    </figure>
  );
}
