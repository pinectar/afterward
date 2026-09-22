// Wires one AgentSession (the Afterward caller) to one SimEngine (the institution line).
import fs from "node:fs";
import path from "node:path";
import { AgentSession } from "./agent-session.mjs";
import { SimEngine } from "../sim/engine.mjs";

export const TOOLS = [
  { type: "function", name: "press_key", description: "Press a key on the institution's phone menu (DTMF). Use when an automated menu offers options; choose the bereavement option.", parameters: { type: "object", properties: { key: { type: "string", description: "Single digit to press, e.g. \"3\"" } }, required: ["key"] }, execution_mode: "interactive", timeout_seconds: 10 },
  { type: "function", name: "flag_needs_family", description: "Escalate to the family: the institution asked for information NOT in your brief (account number, policy number, etc). Never guess instead.", parameters: { type: "object", properties: { asked_for: { type: "string" }, question: { type: "string", description: "The exact question the family must answer" } }, required: ["asked_for", "question"] }, execution_mode: "interactive", timeout_seconds: 10 },
  { type: "function", name: "record_outcome", description: "Record the call outcome in the case file once the clerk issues a case reference. Capture the reference EXACTLY as spoken and the documents requested.", parameters: { type: "object", properties: { reference: { type: "string" }, documents: { type: "array", items: { type: "string" } }, notes: { type: "string" } }, required: ["reference", "documents"] }, execution_mode: "interactive", timeout_seconds: 15 },
];

export function systemPrompt(estate, institutionName) {
  return `You are "Afterward", a calm, polite AI assistant on an outbound phone call to ${institutionName}, registering a bereavement on behalf of a family.

THE BRIEF — the only facts you may state:
- Deceased: ${estate.deceased.fullName} (surname spelled ${estate.deceased.spelling}), died on ${estate.deceased.dodSpoken}.
- You call on behalf of ${estate.executor.name}, her ${estate.executor.relationship}, with the family's permission.
- The family does NOT have account numbers, policy numbers, sort codes or customer references to hand.

RULES
1. The first time a HUMAN answers, open with: "Hello — I'm an AI assistant calling on behalf of the family of Margaret Holt, with their permission, to register a bereavement. The family keeps a recording of this call." Then respond naturally.
2. Automated menus: do not speak to them. Call press_key with the digit for bereavement services.
3. Never invent, guess or estimate anything not in the brief. If asked for something you don't have, say the family will provide it and call flag_needs_family.
4. When the clerk issues a case reference, call record_outcome with the exact reference and the documents requested. If the tool reports a mismatch, ask the clerk to repeat it slowly, digit by digit, and record it again.
5. Keep replies under two sentences, warm and brief. When the clerk wraps up, thank them and say goodbye.`;
}

export async function runCall({ scenarioId, root, holdScale = 1, onEvent = () => {} }) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY not set");
  const scenario = JSON.parse(fs.readFileSync(path.join(root, "lib/sim/scenarios", scenarioId + ".json")));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets/clips/manifest.json")));
  const { ESTATE } = await import(path.join(root, "lib/fixtures/estate.js")).catch(() => import("../fixtures/estate.mjs"));

  const log = [];
  const emit = (e) => { log.push(e); onEvent(e); };
  const session = new AgentSession(apiKey);
  const engine = new SimEngine({ scenario, manifest, root, session, onEvent: emit, holdScale });

  session.on("agent.final", (ev) => { if (!ev.interrupted) engine.agentSaid(ev.text ?? ""); emit({ t: Date.now(), type: "agent.final", text: ev.text, interrupted: !!ev.interrupted }); });
  session.on("user.final", (ev) => emit({ t: Date.now(), type: "line.heard_as", text: ev.text }));
  session.on("protocol.error", (ev) => emit({ t: Date.now(), type: "protocol.error", code: ev.code, message: ev.message }));
  session.on("tool.call", (ev) => {
    emit({ t: Date.now(), type: "tool.call", name: ev.name, args: ev.arguments });
    let res;
    if (ev.name === "press_key") res = engine.pressKey(String(ev.arguments.key ?? ""));
    else if (ev.name === "flag_needs_family") res = engine.flagNeedsFamily(ev.arguments);
    else if (ev.name === "record_outcome") res = engine.recordOutcome(ev.arguments);
    else res = { ok: false, error: `Unknown tool ${ev.name}` };
    session.sendToolResult(ev.call_id, res, res.ok === false);
    emit({ t: Date.now(), type: "tool.result", name: ev.name, ok: res.ok !== false });
  });

  const inst = manifest.scenarios[scenarioId];
  await session.connect({
    system_prompt: systemPrompt(ESTATE, scenario.name),
    tools: TOOLS,
    input: {
      format: { encoding: "audio/pcm" },
      keyterms: ["Holt", "Margaret Rose Holt", "bereavement", "executor", scenario.name, inst.ref],
      transcription_mode: "balanced",
    },
    output: { voice: "alba", format: { encoding: "audio/pcm" } },
    // no greeting: the callee (IVR) speaks first; agent listens.
  });
  emit({ t: Date.now(), type: "session.ready", session_id: session.sessionId });

  // accuracy boost right before the reference is spoken
  const origPlay = engine.play.bind(engine);
  engine.play = async (key) => {
    if (key === "outcome_closing") session.updateSession({ input: { transcription_mode: "max_accuracy", keyterms: ["Holt", inst.ref, "reference"] } });
    return origPlay(key);
  };

  let result, error;
  try { result = await engine.run(); } catch (e) { error = e.message; emit({ t: Date.now(), type: "run.error", error: e.message }); }
  await session.end();
  return { sessionId: session.sessionId, result, error, log, ref: inst.ref, institution: scenario.name };
}
