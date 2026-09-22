// Headless replay engine: folds real captured run events into card state at a clock time.
// Holds are compressed x8 during playback; the on-card timer still shows real elapsed hold.
export type RunEvent = { t: number; type: string; [k: string]: unknown };
export type Run = {
  id: string; institution: string; sessionId?: string; seconds: number; holdSeconds: number;
  amber: { question?: string; asked_for?: string } | null;
  outcome: { reference: string; documents: string[]; notes?: string } | null;
  expectedRef: string; rejections: number; events: RunEvent[]; error?: string | null;
};
export type Fixtures = { totals: Record<string, number | string>; runs: Run[] };

export const HOLD_SPEED = 8;
export const STAGGER_MS = 1200;

export type Prepared = {
  run: Run;
  events: (RunEvent & { at: number })[]; // adjusted (compressed) times, ms from card start
  duration: number;
  holdStartAt: number | null; holdEndAt: number | null; realHoldMs: number;
};

export function prepare(run: Run): Prepared {
  const evs = run.events ?? [];
  let acc = 0, prev = 0, inHold = false, holdStartAt: number | null = null, holdEndAt: number | null = null, realHoldMs = 0;
  const out: (RunEvent & { at: number })[] = [];
  for (const e of evs) {
    const dt = Math.max(0, e.t - prev); prev = e.t;
    acc += inHold ? dt / HOLD_SPEED : dt;
    if (e.type === "hold.started") { inHold = true; holdStartAt = acc; }
    if (e.type === "hold.ended") { inHold = false; holdEndAt = acc; realHoldMs += 0; }
    out.push({ ...e, at: acc });
  }
  if (holdStartAt != null && holdEndAt != null) realHoldMs = (holdEndAt - holdStartAt) * HOLD_SPEED;
  return { run, events: out, duration: acc + 800, holdStartAt, holdEndAt, realHoldMs };
}

export type CardView = {
  id: string; institution: string;
  status: "queued" | "calling" | "hold" | "speaking" | "opened" | "needs-you";
  holdShownSec: number; transcript: { who: "line" | "afterward"; text: string }[];
  ref: string | null; documents: string[]; amberQuestion: string | null;
  justStamped: boolean; flash: boolean; done: boolean;
};

export function fold(p: Prepared, tCard: number): CardView {
  const v: CardView = { id: p.run.id, institution: p.run.institution, status: "queued", holdShownSec: 0, transcript: [], ref: null, documents: [], amberQuestion: null, justStamped: false, flash: false, done: false };
  if (tCard < 0) return v;
  let amber = false, opened = false;
  for (const e of p.events) {
    if (e.at > tCard) break;
    switch (e.type) {
      case "call.started": v.status = "calling"; break;
      case "hold.started": v.status = "hold"; break;
      case "hold.ended": if (v.status === "hold") v.status = "speaking"; break;
      case "line.audio": if (e.text) v.transcript.push({ who: "line", text: String(e.text) }); break;
      case "agent.said": v.transcript.push({ who: "afterward", text: String(e.text) }); break;
      case "amber": amber = true; v.amberQuestion = String((e as { question?: string }).question ?? "the missing detail"); break;
      case "outcome.recorded": opened = true; v.ref = String((e as { reference?: string }).reference ?? p.run.outcome?.reference ?? ""); v.documents = (e as { documents?: string[] }).documents ?? p.run.outcome?.documents ?? []; v.justStamped = tCard - e.at < 700; break;
      case "outcome.rejected": v.flash = tCard - e.at < 500; break;
      case "call.done": v.done = true; break;
    }
  }
  if (amber) v.status = "needs-you";
  else if (opened) v.status = "opened";
  if (v.status === "hold" && p.holdStartAt != null) v.holdShownSec = Math.floor(((tCard - p.holdStartAt) * HOLD_SPEED) / 1000);
  if (v.status !== "hold" && p.holdEndAt != null && tCard >= p.holdEndAt) v.holdShownSec = Math.floor(p.realHoldMs / 1000);
  v.transcript = v.transcript.slice(-2);
  return v;
}

export type TickerRow = { at: number; kind: "tool" | "refused" | "amber" | "opened" | "state"; text: string };
export function tickerRows(preps: Prepared[], tGlobal: number): TickerRow[] {
  const rows: TickerRow[] = [];
  preps.forEach((p, i) => {
    const start = i * STAGGER_MS;
    for (const e of p.events) {
      const at = start + e.at;
      if (at > tGlobal) break;
      const inst = p.run.institution;
      if (e.type === "tool.call") rows.push({ at, kind: "tool", text: `${inst}: agent → ${e.name}` });
      else if (e.type === "outcome.rejected") rows.push({ at, kind: "refused", text: `${inst}: REFUSED — reference mismatch, agent re-asks` });
      else if (e.type === "amber") rows.push({ at, kind: "amber", text: `${inst}: needs the family — ${(e as { asked_for?: string }).asked_for ?? ""}` });
      else if (e.type === "outcome.recorded") rows.push({ at, kind: "opened", text: `${inst}: case opened · ${(e as { reference?: string }).reference}` });
      else if (e.type === "call.started") rows.push({ at, kind: "state", text: `${inst}: dialling` });
    }
  });
  return rows.sort((a, b) => b.at - a.at).slice(0, 60);
}
