"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import raw from "@/fixtures/runs.json";
import { prepare, fold, tickerRows, STAGGER_MS, type Fixtures, type Prepared, type CardView } from "@/lib/replay";
import { CaseCard } from "@/components/CaseCard";
import scenarioKinds from "@/lib/sim/kinds.json";

const fixtures = raw as unknown as Fixtures;

export default function Board() {
  const preps = useMemo(() => fixtures.runs.filter((r) => !r.error).map(prepare), []);
  const total = useMemo(() => preps.length ? Math.max(...preps.map((p, i) => i * STAGGER_MS + p.duration)) : 0, [preps]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const last = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const step = (now: number) => {
      if (last.current == null) last.current = now;
      const dt = now - last.current; last.current = now;
      if (playing) setT((v) => Math.min(v + dt, total));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "r") { setT(0); setPlaying(true); last.current = null; } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const views = preps.map((p, i) => fold(p, t - i * STAGGER_MS));
  const rows = tickerRows(preps, t);
  const opened = views.filter((v) => v.status === "opened").length;
  const needs = views.filter((v) => v.status === "needs-you").length;
  const done = t >= total;

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6">
      <header className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl">Estate of Margaret Rose Holt</h1>
          <p className="text-sm text-ink-muted">Executor: Daniel Holt (son) · died 13 September 2026 · the family does <strong>not</strong> have account or policy numbers</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="btn-secondary text-sm" onClick={() => { setT(0); setPlaying(true); last.current = null; }}>Restart replay (R)</button>
          <button className="btn-primary text-sm" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>{playing ? "Pause" : "Play"}</button>
        </div>
      </header>
      <p className="label mt-2">Simulated test bed — 12 fictional institutions · replaying real captured Voice Agent sessions · holds compressed ×8 · {done ? "replay complete" : "running"}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Institution cases">
          {views.map((v) => (
            <CaseCard key={v.id} v={v} kind={(scenarioKinds as Record<string, string>)[v.id] ?? ""} />
          ))}
        </section>
        <aside className="card h-fit max-h-[70vh] overflow-auto p-3 no-print" aria-label="Event log">
          <div className="label mb-2">Event log</div>
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <p key={r.at + r.text} className={`mono text-[11.5px] leading-snug ${i === 0 ? "fade-in" : ""}`}>
                <span className={r.kind === "refused" ? "chip chip-danger mr-1" : r.kind === "amber" ? "chip chip-needs mr-1" : r.kind === "opened" ? "chip chip-opened mr-1" : "mr-1 text-ink-muted"}>
                  {r.kind === "tool" ? "→" : r.kind.toUpperCase()}
                </span>
                {r.text}
              </p>
            ))}
            {rows.length === 0 && <p className="mono text-[12px] text-ink-muted">Dialling…</p>}
          </div>
        </aside>
      </div>

      <footer className="mt-6 flex flex-wrap items-center gap-6 border-t border-line pt-4">
        <Stat label="Cases opened" value={String(opened)} />
        <Stat label="Need the family" value={String(needs)} />
        <Stat label="Hold endured (real)" value={fmtHold(views)} />
        <a className="btn-secondary ml-auto inline-flex items-center text-sm" href="/ledger/est_holt">Read the Estate Ledger →</a>
      </footer>
    </main>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (<div><div className="label">{label}</div><div className="mono text-xl font-semibold">{value}</div></div>);
}
function fmtHold(views: CardView[]) {
  const s = views.reduce((a, v) => a + v.holdShownSec, 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
