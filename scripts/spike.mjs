#!/usr/bin/env node
// GO/NO-GO: one full simulated call, live against the Voice Agent API.
import { runCall } from "../lib/bridge/orchestrator.mjs";
import fs from "node:fs"; import path from "node:path";
const ROOT = path.resolve(import.meta.dirname, "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n"))
  if (line.includes("=")) { const [k, ...v] = line.split("="); process.env[k] ??= v.join("="); }

const scenarioId = process.argv[2] ?? "northgate-energy";
const t0 = Date.now();
const out = await runCall({
  scenarioId, root: ROOT, holdScale: parseFloat(process.env.HOLD_SCALE ?? "0.15"),
  onEvent: (e) => {
    const s = (Date.now() - t0) / 1000;
    const line = `${s.toFixed(1).padStart(6)}s  ${e.type.padEnd(18)} ${e.text ?? e.clip ?? e.key ?? e.name ?? e.error ?? ""}`;
    if (e.type !== "hold.tick") console.log(line);
  },
});
console.log("\n=== RESULT ===");
console.log("session:", out.sessionId, "| institution:", out.institution, "| expected ref:", out.ref);
if (out.error) { console.log("ERROR:", out.error); process.exit(1); }
const ok = out.result?.outcome?.reference === out.ref && !out.result.amber;
console.log("outcome:", JSON.stringify(out.result.outcome), "| amber:", !!out.result.amber);
console.log(ok ? "SPIKE PASS" : "SPIKE FAIL"); process.exit(ok ? 0 : 1);
