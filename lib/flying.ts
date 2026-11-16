/**
 * Source of the inline loader app/layout.tsx ships on every page for the
 * "flying website" easter egg (public/flying.js). Five theme-toggle clicks, each
 * within 1.5 s of the last, import the module; until then it is this one small
 * listener and nothing is fetched. Inline, so it costs no request.
 */
export const FLYING_WINDOW_MS = 1500;
export const FLYING_CLICKS = 5;

export const FLYING_LOADER =
  `(function(){var n=0,t=0;document.addEventListener('click',function(e){` +
  `var b=e.target&&e.target.closest&&e.target.closest('.theme-toggle');if(!b)return;` +
  `var now=Date.now();n=now-t<${FLYING_WINDOW_MS}?n+1:1;t=now;` +
  `if(n>=${FLYING_CLICKS}){n=0;import('/flying.js').then(function(m){m.fly()})}},true)})()`;
