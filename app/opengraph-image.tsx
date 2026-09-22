import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Afterward — the calls after a death, made for you";
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#F1EFEA", color: "#1D1614", padding: 72, justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 26, color: "#655A54", letterSpacing: 2 }}>AFTERWARD · ESTATE LEDGER</div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>The calls after a death, made for you.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "3px solid #1D1614", paddingTop: 28 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 24, color: "#655A54" }}>Wessex Building Society</div>
            <div style={{ display: "flex", fontSize: 40, fontFamily: "monospace", fontWeight: 700 }}>Case opened · WBS-3098</div>
          </div>
          <div style={{ display: "flex", width: 96, height: 96, borderRadius: 96, border: "6px solid #2E6B4A", alignItems: "center", justifyContent: "center", fontSize: 46, color: "#2E6B4A", fontWeight: 700 }}>A</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
