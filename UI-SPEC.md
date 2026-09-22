---
name: Afterward
design: ./DESIGN.md
direction: "Ledger, mutated: display→Young Serif, warm-tinted neutrals, warning-as-surface amber cards"
personality: precise
dials: { variance: 4, motion: 3, density: 6 }
stack: { next: 16, react: 19, tailwind: 4, motion: none-core-css-only, fonts: next/font/google }
archetype: dashboard + landing
viewports: [390x844, 1024x768, 1440x900]
signature: "A case card flips: the seal stamps 'Case opened · WBS-4471' with a 180ms press; the one amber card washes warm and says exactly what the family must answer"
demo: { seed: fixtures/runs.json, flag: "?demo=1 (default ON — board replays real captured runs)", state_param: "?state=", reset: "R key", guest: true }
deviations:
  - "No Motion lib: precise personality + small motion budget → CSS transitions only (smaller, safer)"
  - "No dark mode: the paper ledger is the identity; color-scheme light"
---
## 0. Idea brief
- User/moment: async hackathon judge, desktop, 30s attention; secondarily a bereaved executor.
- Core loop verb: notify. Hero object: the board of 12 institution case cards.
- Moving data: hold timers tick, transcripts stream, cards flip, seal stamps.
- Wow: 12 parallel calls; a card flips green with a stamped reference while audio of the call plays.
- Artifact: the Estate Ledger (evidence page: refs, quotes, timestamps, stereo recordings).
- Judging: Presentation/Business Value/Application of Technology/Originality, equal. Async via live URL + video.

## 1. Demo script (board replay ≤2:30)
0:00 board already mid-replay (never empty) · 0:10 audible call + transcript · 0:40 first seal stamp · 1:10 amber card washes · 1:40 rejection event in ticker (validator refuses ref) · 2:10 all cards resolved, proof numbers strip counts up · CTA → Ledger.

## 2. Screen inventory
| id | route | purpose | entered from | primary action | states |
| S1 | / | landing: product info, honest what's-real, proof | direct | "Watch the board run" → /board | static |
| S2 | /board | the demo: replayed real runs on 12 cards | S1, direct | replay controls; card→ledger row | replaying, done, live-run(flagged) |
| S3 | /ledger/est_holt | evidence artifact | S2, direct | play recordings; print | populated (fixtures) |
| S4 | /kit | every component every state | direct | — | all |

## 3. Flow map
S1 --CTA--> S2(replaying, autoplay) --card click--> S3#row ; S2 --R--> restart replay

## 4. Screens
S1 LANDING: nav 56 (wordmark, Board, Ledger, GitHub) · hero: 5col text (H1 "The calls after a death, made for you." · sub 1 line · CTA primary "Watch the board run" + secondary "Read the ledger") + 7col live BoardPreview (auto-replaying miniature, real data) · strip: GOV.UK quote (the receipt) · "How it works" 3 real crops (intake→board→ledger) · doctrine trio (Never guesses / Says it's an AI / Evidence for everything) with 1-line each · HONESTY panel "What's real vs simulated" (real: live Voice Agent sessions, STT, tool calls, recordings; simulated: the 12 institutions, labeled) · proof numbers strip (from fixtures/runs.json totals, tabular, counts up on view) · market one-liner + footer.
S2 BOARD: header 64: estate summary (deceased, executor, date) + SIM label chip "SIMULATED TEST BED — 12 fictional institutions" + replay controls (play/pause, ×1 ×8 on holds auto, R restart) · grid 12 CaseCards (3×4 at 1440, 2 col at 1024, 1 col mobile) · right rail 320: EventTicker (tool calls, validator events, mono, newest top) · footer strip: live totals.
S3 LEDGER: paper sheet max-w 880 centered: letterhead (seal + estate) · per institution: ruled row: name · status chip · ref (mono, large) · documents requested · clerk quote + timestamp · AudioPlayer (stereo note: "left channel: institution · right: Afterward") · session id mono 11 · redaction note. Print stylesheet.
## 5. Components (contracts)
C-01 CaseCard: surface-1, line, r6, p16, 300×~180. Header: name + kind label (mono 11 uppercase). StatusChip states: queued/calling(pulse dot)/hold(mono timer ticks)/speaking/opened(success)/needs-you(warning). Body: last 2 transcript lines (mono 12, speaker tags: LINE ink-muted / AFTERWARD accent). Footer: ref stamp area. Transitions: hold→speaking crossfade 150ms; →opened: SealStamp 180ms scale 1.15→1 + chip swap; →needs-you: card bg washes warning 8% 300ms + "Needs you:" question line. Click → /ledger#<id>. ?state= covers all.
C-02 SealStamp: 64px svg circle stamp, accent stroke, curved text; animation stamp 180ms ease-out; reduced-motion: appears without scale.
C-03 EventTicker: mono 12 rows, newest prepend fade 150ms; kinds: tool.call (accent tag), rejection (danger tag "REFUSED"), amber (warning), state (ink-muted). Max 60 rows.
C-04 AudioPlayer: native audio + minimal styling; label + duration mono.
C-05 ProofStrip: 4 numbers tabular (calls, refs verified, escalations, hold endured mm:ss); count-up 600ms on first view only.
C-06 IntakeSummary: card with estate facts + "unavailable: account numbers" line — the brief the agent may not exceed.
C-07 ReplayEngine (headless): consumes fixtures/runs.json events; wall-clock replay, ×8 during hold spans (chip shows ×8); R restarts; emits to cards/ticker.
C-08 HonestyPanel: two-column real vs simulated, line-ruled; links to cheat sheet + repo.
## 6. Choreography
| T-01 | replay event card state | chip swap + transcript line fade 150ms ease-out |
| T-02 | outcome.recorded | SealStamp 180ms + chip→opened; ticker row |
| T-03 | amber | card wash 300ms + question line slides 4px |
| T-04 | rejection | ticker row danger + card chip flashes danger 1× 240ms |
## 7. State machines — CaseCard: queued -call.started-> calling -hold.started-> hold -hold.ended-> speaking -outcome.recorded-> opened | -amber-> needs-you(sticky; outcome may still stamp beneath as "ref issued, awaiting family"). ReplayEngine: idle→playing⇄paused→done -R-> playing.
## 8. Copy deck: buttons: "Watch the board run" · "Read the ledger" · "Restart replay". Amber: "Needs you — {question}". Honest labels: "SIMULATED TEST BED", "replay of a real captured session", "left channel: institution · right: Afterward". Empty states never shown to judges (fixtures always seeded). Errors: "This replay file didn't load. Refresh, or read the ledger instead."
## 9. Brand: mark = seal monogram "A" inside a 48grid circle with a cut telephone-handset counter; favicon svg + theme-color #F1EFEA; OG: ledger row with a stamped ref on paper.
## 10. Don'ts: no dark mode, no chat UI, no orb, no waveform hero, no % claims not in fixtures, no "done" for green.
## 11. Acceptance: qa.mjs screenshots at 390/1024/1440 for /, /board, /ledger/est_holt, /kit; no horizontal scroll at 390; AA contrast; reduced-motion clean; no console errors.
