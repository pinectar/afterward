# lablab submission fields

**Title:** Afterward — the calls after a death, made for you

**Short description (≤ ~200 chars):**
One conversation with the family, then a voice agent phones every bank, insurer, utility and pension — waits on hold, says it's an AI, and returns a verified case reference + recording per account.

**Short description (≤150 chars fallback):**
A voice agent that makes the calls after a death — holds, menus, clerks — and returns a verified case reference and recording for every account.

**Long description:**
When someone dies, the government's Tell Us Once service notifies government — and GOV.UK then tells the family: "You'll also need to tell organisations outside government, like employers and private pension providers, banks, and utility companies." That means days of phone queues, retelling the death to a dozen call centres, in the worst week of a family's life.

Afterward takes one short conversation with the executor, then makes the calls. Built on the AssemblyAI Voice Agent API: one live session per call navigates the phone menu (a press_key DTMF tool), waits through hold music without babbling (orchestrator-side hold suppression), discloses it is an AI on every call, states only facts from the family's brief, and records the outcome through a validated tool — a server-side check refuses any reference that doesn't match what the clerk actually said. Anything the family didn't provide becomes an amber "Needs you" card, never an invention. Every call ends with the sponsor-side stereo recording (institution left, agent right), a timeline, and a verified reference in a shareable Estate Ledger.

Measured on the seeded estate, full-length holds: 12 calls, 12/12 references verified against ground truth, 0 unverified writes, 2 escalations instead of guesses, 1 validator refusal recovered on-call, 9m47s of hold endured. Reproduce with `npm run verify` (offline) — or re-run the whole capture live.

Honesty box: the 12 institutions are a fictional, labelled, deterministic test bed modelled on real bereavement lines — calling a real institution with a fictional death would be fraud, so we refuse to demo it. Green means what a first human call achieves: case opened, documents requested. Never "done."

Market: 650k UK / 2.8M US deaths a year; distribution through funeral directors' aftercare and estate law firms; Empathy (~$90M raised) and Settld prove the category — both stop at forms and email. Nobody makes the calls.

**Technology tags:** AssemblyAI, Vercel, Next.js, Claude Code
**Category tags:** Voice Agents, Productivity, Social Good
**Demo platform:** Vercel
**Application URL:** https://afterward-lablab.vercel.app
**GitHub:** https://github.com/itssaharsh/afterward
**Video:** (MP4, 3:30–4:30 — see docs/deck/ and DEMO_SCRIPT.md)
**Slides:** docs/deck/afterward-deck.pdf
**Cover image:** docs/cover.png (1600×900)

**NOTE:** if any capture is re-run, refresh the proof numbers in README, deck slide 5, and this file — `npm run verify` now asserts totals match the raw runs.
