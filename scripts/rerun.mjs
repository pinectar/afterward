#!/usr/bin/env node
// Re-capture specific scenarios and merge them into fixtures/runs.json.
import { runCall } from "../lib/bridge/orchestrator.mjs";
import fs from "node:fs"; import path from "node:path";
const ROOT = path.resolve(import.meta.dirname, "..");
for (const line of (fs.existsSync(path.join(ROOT, ".env.local")) ? fs.readFileSync(path.join(ROOT, ".env.local"), "utf8") : "").split("\n"))
  if (line.includes("=")) { const [k, ...v] = line.split("="); process.env[k] ??= v.join("="); }
const KEY = process.env.ASSEMBLYAI_API_KEY;
const ids = process.argv.slice(2);
const fx = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures/runs.json")));
for (const id of ids) {
  const t0 = Date.now();
  const out = await runCall({ scenarioId: id, root: ROOT, holdScale: 1 });
  const holdEv = out.log.find((e) => e.type === "hold.started");
  const rec = { id, institution: out.institution, sessionId: out.sessionId, seconds: Math.round((Date.now() - t0) / 1000), holdSeconds: Math.round(holdEv?.plannedSeconds ?? 0), amber: out.result?.amber ?? null, outcome: out.result?.outcome ?? null, expectedRef: out.ref, rejections: out.log.filter((e) => e.type === "outcome.rejected").length, error: out.error ?? null, artifacts: false, events: out.log.filter((e) => e.type !== "hold.tick").map((e) => ({ ...e, t: e.t - t0 })) };
  // artifacts
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`https://agents.assemblyai.com/v1/sessions/${out.sessionId}`, { headers: { Authorization: `Bearer ${KEY}` } });
    const d = await r.json(); const arts = d.artifacts ?? [];
    if (arts.length) { for (const a of arts) { if (a.type === "audio") fs.writeFileSync(path.join(ROOT, "public/recordings", id + ".ogg"), Buffer.from(await (await fetch(a.url)).arrayBuffer())); if (a.type === "timeline") fs.writeFileSync(path.join(ROOT, "fixtures/timelines", id + ".json"), await (await fetch(a.url)).text()); } rec.artifacts = true; break; }
    await new Promise((r) => setTimeout(r, 3000));
  }
  const idx = fx.runs.findIndex((r) => r.id === id);
  fx.runs[idx] = rec;
  const warts = rec.events.filter((e) => e.type === "agent.said" && /^[\(<#\[]/.test(String(e.text).trim())).length;
  console.log(`${id}: ref ${rec.outcome?.reference === rec.expectedRef ? "OK" : "MISMATCH"}${rec.amber ? " AMBER" : ""} ${rec.seconds}s warts=${warts} artifacts=${rec.artifacts}`);
}
fx.totals.totalCallSeconds = fx.runs.reduce((a, r) => a + (r.seconds ?? 0), 0);
fx.totals.rejectionsRecovered = fx.runs.reduce((a, r) => a + (r.rejections ?? 0), 0);
fx.totals.ambers = fx.runs.filter((r) => r.amber).length;
fs.writeFileSync(path.join(ROOT, "fixtures/runs.json"), JSON.stringify(fx, null, 2));
console.log("merged. totals:", JSON.stringify(fx.totals));
