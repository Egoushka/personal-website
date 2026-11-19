// A checker for the subset of JSON Schema that content/radar.schema.json uses
// (type, enum, const, required, properties, additionalProperties, items, $ref to
// #/$defs, minLength, maxLength, pattern). The schema is the contract; this only
// reads it, so the site takes no validator dependency.
import fs from "node:fs";
import path from "node:path";

export function loadRadarSchema(root = process.cwd()) {
  return JSON.parse(fs.readFileSync(path.join(root, "content", "radar.schema.json"), "utf8"));
}

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

/** Problems of `value` against `schema`, as "path: message" lines. Empty means valid. */
export function checkAgainstSchema(value, schema, root = schema, at = "$") {
  if (schema.$ref) {
    const target = schema.$ref.replace(/^#\//, "").split("/").reduce((o, k) => o?.[k], root);
    if (!target) return [`${at}: unresolved ${schema.$ref}`];
    return checkAgainstSchema(value, target, root, at);
  }
  const out = [];
  if ("const" in schema && value !== schema.const) out.push(`${at}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) out.push(`${at}: must be one of ${schema.enum.join(", ")}`);
  if (schema.type && typeOf(value) !== schema.type) {
    out.push(`${at}: must be ${schema.type}`);
    return out;
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) out.push(`${at}: shorter than ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) out.push(`${at}: longer than ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) out.push(`${at}: does not match ${schema.pattern}`);
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((v, i) => out.push(...checkAgainstSchema(v, schema.items, root, `${at}[${i}]`)));
  }
  if (typeOf(value) === "object") {
    for (const k of schema.required ?? []) if (!(k in value)) out.push(`${at}: missing ${k}`);
    const props = schema.properties ?? {};
    for (const [k, v] of Object.entries(value)) {
      if (props[k]) out.push(...checkAgainstSchema(v, props[k], root, `${at}.${k}`));
      else if (schema.additionalProperties === false) out.push(`${at}: unknown field ${k}`);
    }
  }
  return out;
}
