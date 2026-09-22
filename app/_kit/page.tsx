"use client";
import { CaseCard } from "@/components/CaseCard";
import { SealStamp } from "@/components/SealStamp";
import type { CardView } from "@/lib/replay";

const base: CardView = { id: "wessex-bs", institution: "Wessex Building Society", status: "queued", holdShownSec: 0, transcript: [], ref: null, documents: [], amberQuestion: null, justStamped: false, flash: false, done: false };
const states: [string, CardView][] = [
  ["queued", base],
  ["calling", { ...base, status: "calling", transcript: [{ who: "line", text: "Welcome to Wessex Building Society. Calls are recorded." }] }],
  ["hold", { ...base, status: "hold", holdShownSec: 47, transcript: [{ who: "line", text: "Thank you for holding. An adviser will be with you shortly." }] }],
  ["speaking", { ...base, status: "speaking", transcript: [{ who: "line", text: "Bereavement team, Susan speaking." }, { who: "afterward", text: "Hello — I'm an AI assistant calling on behalf of the family of Margaret Holt…" }] }],
  ["opened", { ...base, status: "opened", ref: "WBS-3098", justStamped: false, transcript: [{ who: "line", text: "Your reference is WBS-3098." }] }],
  ["needs-you", { ...base, status: "needs-you", ref: "WBS-3098", amberQuestion: "What is the account number or sort code?", transcript: [{ who: "line", text: "Do you have the account number to hand?" }] }],
  ["rejected-flash", { ...base, status: "speaking", flash: true, transcript: [{ who: "afterward", text: "Could you repeat the reference slowly, digit by digit?" }] }],
];
export default function Kit() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <section><h1 className="text-2xl">Kit</h1><p className="label mt-1">every component, every state</p></section>
      <section>
        <h2 className="label mb-3">CaseCard</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {states.map(([n, v]) => (<div key={n}><div className="label mb-1">{n}</div><CaseCard v={v} kind="bank" /></div>))}
        </div>
      </section>
      <section>
        <h2 className="label mb-3">Seal</h2>
        <div className="flex items-center gap-8"><SealStamp refCode="WBS-3098" animate={false} /><SealStamp refCode="NGE-4102" animate /></div>
      </section>
      <section>
        <h2 className="label mb-3">Chips</h2>
        <div className="flex flex-wrap gap-2">
          <span className="chip chip-queued">Queued</span><span className="chip chip-calling"><span className="pulse-dot" />Calling</span>
          <span className="chip chip-hold">On hold 0:47 · ×8</span><span className="chip chip-opened">Case opened</span>
          <span className="chip chip-needs">Needs you</span><span className="chip chip-danger">Refused</span>
        </div>
      </section>
      <section>
        <h2 className="label mb-3">Buttons + type</h2>
        <div className="flex flex-wrap items-center gap-3"><button className="btn-primary">Watch the board run</button><button className="btn-secondary">Read the ledger</button></div>
        <h1 className="mt-6 text-4xl">Display — Young Serif</h1>
        <p className="mt-2">Body — Familjen Grotesk. <span className="mono">Mono — JetBrains 4102 · 13:09:26</span></p>
        <div className="mt-3 flex items-center gap-4"><img src="/icon.svg" width="16" alt="mark 16" /><img src="/icon.svg" width="32" alt="mark 32" /><img src="/icon.svg" width="128" alt="mark 128" /></div>
      </section>
    </main>
  );
}
