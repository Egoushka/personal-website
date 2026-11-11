// node docs/redesign/round2/_build/build.mjs — writes every round-2 HTML page from data.mjs.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url)), out = join(here, "..");
const names = process.argv.slice(2).length ? process.argv.slice(2) : ["mission-control", "blocks", "product-studio"];
for (const n of names) {
  const pages = (await import(`./${n}.mjs`)).default;
  for (const [f, html] of Object.entries(pages)) { writeFileSync(join(out, f), html); console.log("wrote", f, html.length); }
}
