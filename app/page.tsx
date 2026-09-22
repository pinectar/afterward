import raw from "@/fixtures/runs.json";
import type { Fixtures } from "@/lib/replay";
import Link from "next/link";

const fixtures = raw as unknown as Fixtures;

export default function Landing() {
  const t = fixtures.totals;
  const holdMin = Math.floor(Number(t.totalHoldSeconds) / 60);
  return (
    <main>
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="text-[clamp(2.4rem,1.5rem+3vw,3.6rem)] leading-[1.08]">The calls after a death, made for you.</h1>
          <p className="mt-4 text-lg text-ink-muted">
            One conversation with the family. Then Afterward phones every bank, insurer, utility and pension —
            waits on hold, says it’s an AI, and brings back a case reference and a recording for every account.
            It never guesses: anything missing comes back as a question, not an invention.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/board" className="btn-primary inline-flex items-center">Watch the board run</Link>
            <Link href="/ledger/est_holt" className="btn-secondary inline-flex items-center">Read the Estate Ledger</Link>
          </div>
          <p className="label mt-6">No sign-in. Live replay of real captured sessions.</p>
        </div>
        <div className="lg:col-span-7">
          <div className="card p-4">
            <div className="label mb-3">The board — 12 institutions, one afternoon of calls</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {fixtures.runs.filter((r) => !r.error).slice(0, 12).map((r) => (
                <div key={r.id} className={`card p-3 ${r.amber ? "card-amber" : ""}`}>
                  <div className="truncate text-[13px] font-semibold">{r.institution}</div>
                  {r.amber
                    ? <span className="chip chip-needs mt-1">Needs you</span>
                    : <span className="chip chip-opened mt-1">Case opened</span>}
                  <div className="mono mt-1 text-[12px]">{r.outcome?.reference}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface-1">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <blockquote className="text-lg">
            “You’ll also need to tell organisations outside government, like employers and private pension providers,
            banks, and utility companies.”
          </blockquote>
          <p className="label mt-2">GOV.UK — “What to do after someone dies”. Tell Us Once covers government. Everyone else answers the phone.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl">Doctrine, not features</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["It never guesses", "A server-side validator checks every reference against what the clerk actually said. A wrong capture is refused and re-asked. Anything the family didn’t provide becomes an amber “Needs you” card — there is no code path that invents a value."],
            ["It says it’s an AI", "Every call opens by disclosing an AI assistant is calling with the family’s permission — the EU AI Act (Art. 50, in force 2 Aug 2026) requires it; decency required it first."],
            ["Evidence for everything", "Each call ends with a stereo recording (institution left, Afterward right), a timeline, and a verified reference in the Estate Ledger the family can share with a solicitor."],
          ].map(([h, b]) => (
            <div key={h} className="card p-5">
              <h3 className="font-semibold">{h}</h3>
              <p className="mt-2 text-sm text-ink-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface-1">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl">What’s real, and what’s simulated</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div>
              <div className="label mb-2">Real</div>
              <ul className="ruled text-sm [&>li]:py-2">
                <li>Every card replays a real AssemblyAI Voice Agent session — live speech-to-text, turn-taking, tool calls, TTS.</li>
                <li>The reference numbers were heard, validated and recorded by the agent on those calls.</li>
                <li>The recordings and timelines are the sponsor-side session artifacts, unedited.</li>
                <li>The refusals are real: mismatched references were rejected by the validator mid-call.</li>
              </ul>
            </div>
            <div>
              <div className="label mb-2">Simulated — and labelled</div>
              <ul className="ruled text-sm [&>li]:py-2">
                <li>The 12 institutions are fictional. Their phone lines are a deterministic, scripted test bed (menus, hold music, clerks) modelled on real bereavement lines.</li>
                <li>No real institution was ever told of a fictional death — that would be fraud, so we refuse to demo it.</li>
                <li>Holds ran at full length in the captured sessions; the board replays them ×8.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap gap-10">
          <Big v={String(t.calls)} l="calls made" />
          <Big v={String(t.refsVerified)} l="references verified" />
          <Big v={`${holdMin}m`} l="of hold endured" />
          <Big v="0" l="unverified writes" />
        </div>
        <p className="label mt-4">Measured on the seeded estate, full-length holds, single afternoon. Method in the repo.</p>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-8 text-sm text-ink-muted">
          <span>Afterward — AssemblyAI Voice Agent Hackathon 2026.</span>
          <span className="ml-auto">Tell Us Once covers government · the Death Notification Service covers member banks · Afterward calls everyone else.</span>
        </div>
      </footer>
    </main>
  );
}
function Big({ v, l }: { v: string; l: string }) {
  return (<div><div className="mono text-4xl font-semibold">{v}</div><div className="label mt-1">{l}</div></div>);
}
