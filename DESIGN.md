---
name: Afterward
description: An archival, trustworthy register for the calls that follow a death — paper, ink, reference numbers, a seal.
colors:
  canvas: "#F1EFEA"
  surface-1: "#FAF9F6"
  surface-2: "#E7E3DA"
  line: "#CFC9BC"
  ink: "#1D1614"
  ink-muted: "#655A54"
  accent: "#6E1423"
  accent-ink: "#F8EDEB"
  success: "#2E6B4A"
  warning: "#7A5100"
  danger: "#C4320A"
typography:
  fontFamily:
    display: "Young Serif"
    body: "Familjen Grotesk"
    mono: "JetBrains Mono"
rounded: { sm: "2px", md: "4px", lg: "6px" }
spacing: { base: "4px" }
---

# Overview
Afterward is a bereavement notification agent. The UI is a registrar's ledger: warm paper, oxblood ink, ruled lines, tabular reference numbers, and a seal that stamps when a case opens. Calm and precise; never grim, never playful.

# Colors
- canvas #F1EFEA: page background, always. surface-1 #FAF9F6: cards. surface-2 #E7E3DA: hover fills, skeletons.
- ink #1D1614 body text; ink-muted #655A54 secondary only.
- accent #6E1423 (oxblood): the one primary CTA per view, seal stamps, active nav, live transcript speaker tags. Never body text. Budget ≤5% of pixels.
- success #2E6B4A: "Case opened" chips + seal. warning #7A5100 text on amber; amber cards use warning at 10% as a SURFACE. danger #C4320A: validator rejections only.
- Never: purple, gradients, glass, glow shadows.

# Typography
- Display: Young Serif, h1 clamp(2.2rem,1.5rem+3vw,4rem), line-height 1.1, tracking -0.02em. Only h1/h2 and the seal.
- Body: Familjen Grotesk 400/600, 16px/1.55.
- Mono: JetBrains Mono for every number, reference, timestamp, transcript line; font-variant-numeric: tabular-nums, always.
- Uppercase labels: mono 11px +0.1em, ink-muted. Max one eyebrow per three sections.

# Layout
4px base. 12 columns, 24px gutters ≥1024, max width 1280. Tight inside groups (4–8px), generous between (48–64px). Board cards min 300px.

# Elevation & Depth
Flat paper. Cards: surface-1 + 1px line, no shadow at rest. Only modals/players float: shadow "0 1px 0 rgba(29,22,20,.06), 0 12px 32px -8px rgba(29,22,20,.2)".

# Shapes
Radius 2/4/6 only. No pills except status chips (r 4). Ruled lines (1px line color) under table rows and ledger entries.

# Components
- button-primary: bg {colors.accent}, text {colors.accent-ink}, h 40px, radius 4px, weight 600. Hover: darken 6%. Press: scale .97.
- chip-status: mono 11px uppercase; queued=line border+ink-muted; calling=accent border+accent text+pulsing dot; hold=warning text+timer; opened=success 12% bg+success text; needs-you=warning 10% SURFACE card wash+warning text.
- card-case: surface-1, 1px line, radius 6, padding 16. Amber variant: whole card washed warning 8%.
- seal: 64px circle, 2px accent border, mono 10px uppercase curved text "AFTERWARD · CASE OPENED"; stamps scale 1.15→1 in 180ms.

# Do's and Don'ts
- DO: real reference numbers, real timestamps, real audio. Tabular numerals on everything that counts.
- DON'T: spinners where a named state fits ("On hold 0:47"), emoji, ✨, generic AI orbs, dark mode, confetti. Never animate transcript text beyond a 150ms fade. Never call green "done" — it is "Case opened".
