#!/usr/bin/env node
// content/radar.json against content/radar.schema.json. Part of `npm run validate`.
import fs from "node:fs";
import path from "node:path";
import { checkAgainstSchema, loadRadarSchema } from "../lib/radar-schema.mjs";

const root = process.cwd();
const data = JSON.parse(fs.readFileSync(path.join(root, "content", "radar.json"), "utf8"));
const problems = checkAgainstSchema(data, loadRadarSchema(root));
const names = data.entries?.map((e) => e.name) ?? [];
for (const n of names) if (names.indexOf(n) !== names.lastIndexOf(n)) problems.push(`duplicate entry: ${n}`);
if (problems.length) {
  console.error(`radar.json does not match radar.schema.json:\n${[...new Set(problems)].map((p) => `  ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`radar.json: ${data.entries.length} entries valid`);
