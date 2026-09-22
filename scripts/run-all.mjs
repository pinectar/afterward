#!/usr/bin/env node
// Canonical measured dataset: run all 12 simulated calls at REAL hold times,
// download the sponsor-side stereo recordings + timelines, compute proof numbers.
import { runCall } from "../lib/bridge/orchestrator.mjs";
import fs from "node:fs"; import path from "node:path";
const ROOT = path.resolve(import.meta.dirname, "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n"))
  if (line.includes("=")) { const [k, ...v] = line.split("="); process.env[k] ??= v.join("="); }
const KEY = process.env.ASSEMBLYAI_API_KEY;
const HOLD_SCALE = parseFloat(process.env.HOLD_SCALE ?? "1");
const CONC = parseInt(process.env.CONC ?? "2");

const scenarios = fs.readdirSync(path.join(ROOT, "lib/sim/scenarios")).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
const results = [];

async function fetchArtifacts(sessionId, id) {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`https://agents.assemblyai.com/v1/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${KEY}` } });
    const d = await r.json();
    const arts = d.artifacts ?? [];
    if (arts.length) {
      for (const a of arts) {
        if (a.type === "audio") {
          const buf = Buffer.from(await (await fetch(a.url)).arrayBuffer());
          fs.writeFileSync(path.join(ROOT, "public/recordings", id + ".ogg"), buf);
        } else if (a.type === "timeline") {
          const t = await (await fetch(a.url)).text();
          fs.writeFileSync(path.join(ROOT, "fixtures/timelines", id + ".json"), t);
        }
      }
      return true;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function one(id) {
  const t0 = Date.now();
  try {
    const out = await runCall({ scenarioId: id, root: ROOT, holdScale: HOLD_SCALE });
    const secs = (Date.now() - t0) / 1000;
    const holdEv = out.log.filter((e) => e.type === "hold.started")[0];
    const rejects = out.log.filter((e) => e.type === "outcome.rejected").length;
    const got = await fetchArtifacts(out.sessionId, id).catch(() => false);
    const rec = { id, institution: out.institution, sessionId: out.sessionId, seconds: Math.round(secs), holdSeconds: Math.round((holdEv?.plannedSeconds ?? 0)), amber: out.result?.amber ?? null, outcome: out.result?.outcome ?? null, expectedRef: out.ref, rejections: rejects, error: out.error ?? null, artifacts: got, events: out.log.filter((e) => e.type !== "hold.tick").map((e) => ({ ...e, t: e.t - t0 })) };
    results.push(rec);
    console.log(`[${results.length}/${scenarios.length}] ${id}: ${out.error ? "ERROR " + out.error : (rec.outcome?.reference === out.ref ? "ref OK" : "REF MISMATCH") + (rec.amber ? " AMBER" : "") + ` ${rec.seconds}s`}`);
  } catch (e) {
    results.push({ id, error: e.message });
    console.log(`[${results.length}/${scenarios.length}] ${id}: FATAL ${e.message}`);
  }
}

const queue = [...scenarios];
await Promise.all(Array.from({ length: CONC }, async () => { while (queue.length) await one(queue.shift()); }));

const ok = results.filter((r) => r.outcome && r.outcome.reference === r.expectedRef);
const totals = {
  calls: results.length,
  refsVerified: ok.length,
  ambers: results.filter((r) => r.amber).length,
  rejectionsRecovered: results.reduce((a, r) => a + (r.rejections ?? 0), 0),
  unverifiedWrites: results.filter((r) => r.outcome && r.outcome.reference !== r.expectedRef).length,
  totalCallSeconds: results.reduce((a, r) => a + (r.seconds ?? 0), 0),
  totalHoldSeconds: results.reduce((a, r) => a + (r.holdSeconds ?? 0), 0),
  holdScale: HOLD_SCALE,
  measuredAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(ROOT, "fixtures/runs.json"), JSON.stringify({ totals, runs: results }, null, 2));
console.log("\nTOTALS", JSON.stringify(totals, null, 2));
