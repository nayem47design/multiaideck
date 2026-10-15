// Replace one top-level namespace in src/messages/en.json and bn.json.
//   node scripts/set-messages.mjs <namespace> <en-file.json> <bn-file.json>
// Each file holds just that namespace's object. Keys are written in a stable order, so several
// people (or agents) can own different namespaces without clobbering each other.

import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [ns, enFile, bnFile] = process.argv.slice(2);
if (!ns || !enFile || !bnFile) {
  console.error(
    "usage: node scripts/set-messages.mjs <namespace> <en.json> <bn.json>",
  );
  process.exit(1);
}
const dir = join(dirname(fileURLToPath(import.meta.url)), "../src/messages");

function keysOf(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object"
      ? keysOf(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}
const en = JSON.parse(readFileSync(enFile, "utf8"));
const bn = JSON.parse(readFileSync(bnFile, "utf8"));
const missing = keysOf(en).filter((k) => !keysOf(bn).includes(k));
const extra = keysOf(bn).filter((k) => !keysOf(en).includes(k));
if (missing.length || extra.length) {
  console.error(`"${ns}": en and bn keys differ`, { missing, extra });
  process.exit(1);
}

for (const [locale, value] of [
  ["en", en],
  ["bn", bn],
]) {
  const file = join(dir, `${locale}.json`);
  const all = JSON.parse(readFileSync(file, "utf8"));
  all[ns] = value;
  const sorted = Object.fromEntries(
    Object.keys(all)
      .sort()
      .map((k) => [k, all[k]]),
  );
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(sorted, null, 2) + "\n");
  renameSync(tmp, file);
}
console.log(
  `messages: set "${ns}" (${keysOf(en).length} keys) in en.json and bn.json`,
);
