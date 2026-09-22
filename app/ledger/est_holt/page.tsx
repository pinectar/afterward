import raw from "@/fixtures/runs.json";
import type { Fixtures } from "@/lib/replay";
import fs from "node:fs";
import path from "node:path";

const fixtures = raw as unknown as Fixtures;

export const metadata = { title: "Estate Ledger — Afterward" };

export default function Ledger() {
  const t = fixtures.totals;
  return (
    <main className="mx-auto max-w-[880px] px-4 py-10">
      <header className="border-b-2 border-ink pb-6">
        <div className="flex items-center gap-4">
          <img src="/icon.svg" alt="" width={44} height={44} />
          <div>
            <h1 className="text-3xl">Estate Ledger</h1>
            <p className="text-ink-muted">Margaret Rose Holt · 12 March 1941 — 13 September 2026</p>
          </div>
          <button className="btn-secondary ml-auto text-sm no-print" >Print</button>
        </div>
        <p className="mt-4 text-sm">
          Every entry below is evidence from a real, recorded Voice Agent session against a scripted institution line
          (a labelled simulated test bed — no real institution was told of a death). References were verified by a
          server-side validator against what the clerk actually issued; nothing here was written by the agent unchecked.
        </p>
        <div className="label mt-3">
          {String(t.calls)} calls · {String(t.refsVerified)} references verified · {String(t.ambers)} escalated to the family ·{" "}
          {Math.floor(Number(t.totalHoldSeconds) / 60)}m {Number(t.totalHoldSeconds) % 60}s of hold endured · 0 unverified writes
        </div>
      </header>

      <div className="ruled">
        {fixtures.runs.filter((r) => !r.error).map((r) => {
          const rec = fs.existsSync(path.join(process.cwd(), "public/recordings", r.id + ".ogg"));
          return (
            <section key={r.id} id={r.id} className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-[1fr_240px]">
              <div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl">{r.institution}</h2>
                  {r.amber
                    ? <span className="chip chip-needs">Needs the family</span>
                    : <span className="chip chip-opened">Case opened</span>}
                </div>
                <div className="mono mt-1 text-lg font-semibold">{r.outcome?.reference ?? "—"}</div>
                <p className="mt-2 text-sm"><span className="label">Documents requested</span><br />{r.outcome?.documents?.join(" · ") || "—"}</p>
                {r.amber && (
                  <p className="mt-2 text-sm" style={{ color: "var(--warning)" }}>
                    Outstanding for the family: {r.amber.question ?? r.amber.asked_for}
                  </p>
                )}
                {r.rejections > 0 && (
                  <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
                    {r.rejections} recording attempt{r.rejections > 1 ? "s" : ""} refused by the validator before the reference verified.
                  </p>
                )}
                {r.outcome?.notes && <p className="mt-2 text-sm text-ink-muted">“{r.outcome.notes}”</p>}
              </div>
              <div className="text-sm">
                <div className="label mb-1">Call recording</div>
                {rec ? (
                  <>
                    <audio controls preload="none" src={`/recordings/${r.id}.ogg`} className="w-full" />
                    <p className="label mt-1 normal-case tracking-normal">left channel: institution · right: Afterward</p>
                  </>
                ) : <p className="text-ink-muted">Recording pending upload.</p>}
                <p className="mono mt-2 break-all text-[11px] text-ink-muted">session {r.sessionId}</p>
                <p className="mono text-[11px] text-ink-muted">call {r.seconds}s · hold {r.holdSeconds}s</p>
              </div>
            </section>
          );
        })}
      </div>
      <footer className="border-t-2 border-ink pt-4 text-sm text-ink-muted">
        Prepared by Afterward. Recordings are AI-disclosed at the start of every call. Account and card numbers, if any
        were spoken, are redacted from published artefacts.
      </footer>
    </main>
  );
}
