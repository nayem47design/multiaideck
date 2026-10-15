// node screen.mjs (desktop + mobile) "Screen name" [maxDepth] [filterSubstring] — print a screen's layer tree from screens.json
import { readFileSync } from "node:fs";
const F = new URL("../src/styles/figma/", import.meta.url).pathname;
const screens = {
  ...JSON.parse(readFileSync(F + "screens.json", "utf8")).screens,
  ...JSON.parse(readFileSync(F + "screens-mobile.json", "utf8")).screens,
};
const [name, depthArg = "6", filter] = process.argv.slice(2);
const s = screens[name];
if (!s) {
  console.log(Object.keys(screens).join("\n"));
  process.exit();
}
const out = [];
(function walk(n, d) {
  const a = [
    `${"  ".repeat(d)}${n.t === "INSTANCE" ? "◇" : ""}${n.n}`,
    `${n.w}×${n.h}@${n.x},${n.y}`,
  ];
  if (n.hidden) a.push("HIDDEN");
  if (n.op) a.push("op" + n.op);
  if (n.al)
    a.push(
      `${n.al[0]} pad[${n.al.slice(1, 5)}] gap${n.al[5]} ${n.al[6]}/${n.al[7]}`,
    );
  if (n.r) a.push("r" + n.r);
  if (n.f) a.push("f:" + n.f.join("+"));
  if (n.s) a.push("s:" + n.s.join("+"));
  if (n.fx) a.push("fx:" + n.fx);
  if (n.c !== undefined)
    a.push(`"${n.c.slice(0, 70).replace(/\n/g, "⏎")}" ${n.ts}`);
  if (n.m) a.push("m=" + n.m);
  if (n.p) a.push("p:" + n.p.join("|"));
  out.push(a.join(" "));
  if (n.k && d < Number(depthArg) && !(n.t === "INSTANCE" && !filter))
    for (const c of n.k) walk(c, d + 1);
})(s, 0);
console.log(
  filter ? out.filter((l) => l.includes(filter)).join("\n") : out.join("\n"),
);
