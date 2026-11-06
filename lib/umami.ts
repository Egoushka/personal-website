/** Set by /umami-off/ (deploy/Caddyfile). Not HttpOnly: the tracker's hook has to read it. */
export const UMAMI_OFF_COOKIE = "umami-off";

/**
 * Source of `window.umamiBeforeSend`, inlined by app/layout.tsx. Umami calls it
 * with every payload and sends nothing when it returns null. A frame is not a
 * visit (the heatmap view loads each page in an iframe), and neither is a
 * browser that opted out. Inline, so it costs no bundle bytes.
 */
export const UMAMI_BEFORE_SEND =
  `window.umamiBeforeSend=function(t,p){return window.top===window&&!/(^|; )${UMAMI_OFF_COOKIE}=1/.test(document.cookie)?p:null};`;
