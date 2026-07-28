# Source images

Drop originals here (`.jpg` / `.png`, full resolution). `npm run images` — which
`npm run build` runs first — emits AVIF + WebP + JPEG at 480/960/1440 into
`public/img/`, plus a sidecar `.json` with the intrinsic size.

Render one with:

```tsx
<Picture name="desk" alt="My desk setup" priority />
```

`public/img/` is generated and gitignored. Sources here are committed, so a
fresh clone can rebuild every derivative.

**Currently empty.** The site has no photographs — the only images are the
generated OG cards and the inline SVG diagram. A portrait on `/about/` is the
obvious first one; the pipeline is ready for it.
