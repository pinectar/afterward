export function SealStamp({ refCode, animate }: { refCode: string; animate: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${animate ? "stamp-in" : ""}`}>
      <svg width="34" height="34" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="21" fill="none" stroke="var(--success)" strokeWidth="2.5" />
        <path d="M15 25.5l6 6L33 17" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>
        <div className="label" style={{ color: "var(--success)" }}>Case opened</div>
        <div className="mono text-sm font-semibold">{refCode}</div>
      </div>
    </div>
  );
}
