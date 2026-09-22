import type { CardView } from "@/lib/replay";
import { SealStamp } from "./SealStamp";

const KIND_LABEL: Record<string, string> = {};
function Chip({ v }: { v: CardView }) {
  if (v.status === "queued") return <span className="chip chip-queued">Queued</span>;
  if (v.status === "calling") return <span className="chip chip-calling"><span className="pulse-dot" />Calling</span>;
  if (v.status === "hold") return <span className="chip chip-hold">On hold {fmt(v.holdShownSec)} · ×8</span>;
  if (v.status === "speaking") return <span className="chip chip-calling"><span className="pulse-dot" />Speaking</span>;
  if (v.status === "needs-you") return <span className="chip chip-needs">Needs you</span>;
  return <span className="chip chip-opened">Case opened</span>;
}
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function CaseCard({ v, kind }: { v: CardView; kind: string }) {
  return (
    <a href={`/ledger/est_holt#${v.id}`} className={`card block p-4 transition-colors ${v.status === "needs-you" ? "card-amber" : ""} ${v.flash ? "outline outline-2 outline-danger" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold leading-tight">{v.institution}</div>
          <div className="label mt-0.5">{kind}</div>
        </div>
        <Chip v={v} />
      </div>
      <div className="mt-3 min-h-[54px] space-y-1">
        {v.transcript.map((l, i) => (
          <p key={i} className="mono fade-in text-[12px] leading-snug">
            <span style={{ color: l.who === "afterward" ? "var(--accent)" : "var(--ink-muted)" }}>
              {l.who === "afterward" ? "AFTERWARD" : "LINE"}
            </span>{" "}
            {l.text.length > 92 ? l.text.slice(0, 92) + "…" : l.text}
          </p>
        ))}
        {v.transcript.length === 0 && <p className="mono text-[12px] text-ink-muted">—</p>}
      </div>
      <div className="mt-3 border-t border-line pt-3 min-h-[46px]">
        {v.status === "needs-you" && (
          <p className="text-[13px] font-medium" style={{ color: "var(--warning)" }}>
            Needs you — {v.amberQuestion}
            {v.ref && <span className="mono block text-[12px] font-normal">ref issued: {v.ref} · awaiting family</span>}
          </p>
        )}
        {v.status === "opened" && v.ref && <SealStamp refCode={v.ref} animate={v.justStamped} />}
        {v.status !== "opened" && v.status !== "needs-you" && <span className="label">No case yet</span>}
      </div>
    </a>
  );
}
