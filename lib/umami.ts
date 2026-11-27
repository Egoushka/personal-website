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

/**
 * The delegated events the tracker cannot see on its own, inlined by app/layout.tsx after UMAMI_BEFORE_SEND.
 * No cookies, no storage, no text: only counts and names.
 * - outbound: leaving the site. `url` is the origin and path only (no query, which can carry tokens); mailto: and tel: send the scheme only.
 * - download: xml, json and pdf links on this site.
 * - copy: something was copied (never what).
 * - scroll-50 / scroll-90: depth on pages at least two screens tall.
 * - time-15 / time-60 / time-180: seconds the page was visible, once per page, so dwell does not depend on a page unload.
 * umami is undefined when the tracker is blocked or still loading, and then nothing is sent.
 */
export const UMAMI_EVENTS =
  "(function(){function t(n,d){if(window.umami)window.umami.track(n,d)}" +
  "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;" +
  "if(a.protocol==='mailto:'||a.protocol==='tel:')t('outbound',{url:a.protocol});" +
  "else if(a.origin!==location.origin)t('outbound',{url:a.origin+a.pathname});" +
  "else if(/\\.(xml|json|pdf)$/.test(a.pathname))t('download',{file:a.pathname})},true);" +
  "document.addEventListener('copy',function(){t('copy')});" +
  "var seen={};addEventListener('scroll',function(){var d=document.documentElement,h=d.scrollHeight;if(h<innerHeight*2)return;" +
  "var p=(scrollY+innerHeight)/h,k=location.pathname;" +
  "[50,90].forEach(function(m){var id=k+m;if(p*100>=m&&!seen[id]){seen[id]=1;t('scroll-'+m)}})},{passive:true});" +
  "var shown={},sec=0,page=location.pathname;" +
  "setInterval(function(){if(location.pathname!==page){page=location.pathname;sec=0}" +
  "if(document.visibilityState!=='visible')return;sec++;" +
  "[15,60,180].forEach(function(m){var id=page+m;if(sec===m&&!shown[id]){shown[id]=1;t('time-'+m)}})},1000)})()";

/** The opt-in cookie: a random id, set only when a visitor clicks "Remember me" in the footer. */
export const VISITOR_COOKIE = "visitor-id";
/** 13 months, in seconds. */
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 395;
const ID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** The id in a `document.cookie` string, or null when the visitor has not opted in. */
export function readVisitorId(cookie: string): string | null {
  return cookie.match(new RegExp(`(?:^|; )${VISITOR_COOKIE}=(${ID})(?:;|$)`))?.[1] ?? null;
}

/** The cookie to write on opt-in (`id` from crypto.randomUUID) or, with no id, the one that removes it. */
export function visitorCookie(id: string | null): string {
  return `${VISITOR_COOKIE}=${id ?? ""}; Max-Age=${id ? VISITOR_MAX_AGE : 0}; Path=/; SameSite=Lax; Secure`;
}

/**
 * Inlined by app/layout.tsx. A remembered visitor is introduced to Umami on every page, so their visits join
 * up across days and networks. Nothing runs without the cookie.
 */
export const UMAMI_REMEMBER =
  `(function(){var m=document.cookie.match(/(?:^|; )${VISITOR_COOKIE}=(${ID})(?:;|$)/);if(!m)return;` +
  "function go(){if(window.umami&&window.umami.identify)window.umami.identify(m[1])}" +
  "if(document.readyState==='complete')go();else addEventListener('load',go)})();";

/** Set to "no" when a visitor declines the first-visit prompt, so it is not shown again. */
export const CHOICE_KEY = "visitor-choice";

/**
 * Coarse, non-identifying facts about the browser, sent once per visit (on the entry page) as Umami session data:
 * time zone, light or dark, touch, reduced motion, viewport width to the nearest 100 px, pixel ratio and connection
 * type. Nothing stored in the browser; nothing that names a person.
 */
export const UMAMI_TRAITS =
  "(function(){function go(){var u=window.umami;if(!u||!u.identify)return;" +
  "var r=document.referrer;try{if(r&&new URL(r).origin===location.origin)return}catch(e){}" +
  "var c=navigator.connection&&navigator.connection.effectiveType,d={tz:Intl.DateTimeFormat().resolvedOptions().timeZone," +
  "scheme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light',touch:('ontouchstart' in window)?1:0," +
  "reduced:matchMedia('(prefers-reduced-motion: reduce)').matches?1:0,vw:Math.round(innerWidth/100)*100,dpr:Math.round(devicePixelRatio*10)/10};" +
  "if(c)d.net=c;u.identify(d)}" +
  "if(document.readyState==='complete')go();else addEventListener('load',go)})();";

/**
 * Script errors as events: the message (120 characters, no stack) and the path, once per message per page.
 * The site is static, so a failing script is otherwise invisible until someone writes in.
 */
export const UMAMI_ERRORS =
  "(function(){var seen={};function r(m){m=String(m||'').slice(0,120);var k=location.pathname+m;if(seen[k]||!window.umami)return;" +
  "seen[k]=1;window.umami.track('js-error',{msg:m,path:location.pathname})}" +
  "addEventListener('error',function(e){r(e.message)});" +
  "addEventListener('unhandledrejection',function(e){r(e.reason&&e.reason.message||e.reason)})})();";
