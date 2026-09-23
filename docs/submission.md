# lablab submission fields

## FORM-READY (verified against the live form limits, Sep 23)

```
TITLE
Afterward — the calls after a death, made for you

SHORT
One conversation with the family, then a voice agent phones every bank, insurer, utility and pension — waits on hold, says it's an AI, and returns a verified case reference and a recording for every account. It never guesses.

LONG
When someone dies in the UK, the government's Tell Us Once service notifies every government department with one form. Then GOV.UK tells the family, in its own words: "You'll also need to tell organisations outside government, like employers and private pension providers, banks, and utility companies." So the family spends the worst week of their lives in phone queues, repeating the death to a dozen call centres.

Afterward makes those calls instead. One short conversation with the executor, and it phones each institution: presses the menu keys, waits through the hold in silence, opens by saying it's an AI calling with the family's permission, states only facts from the family's brief, and records the outcome through a validated tool. A server-side check compares every reference against what the clerk actually said and refuses anything that doesn't match — it refused its own agent once, mid-call, and recovered on the same call. Anything the family didn't provide becomes an amber "Needs you" card instead of a guess. Every call ends with a stereo recording (institution left, Afterward right), a timeline, and a verified reference in a shareable Estate Ledger.

Measured at full-length holds: 12 calls, 12/12 references verified, 0 unverified writes, 2 escalations instead of guesses, 9m47s of hold endured. Run "npm run verify" to reproduce it offline.

Honesty: the twelve institutions are a fictional, labelled test bed modelled on real bereavement lines — calling a real bank about a fictional death would be fraud, so we refuse to demo that. Everything the agent did on those calls was real: live AssemblyAI Voice Agent sessions, real tool calls, unedited recordings.

The business: 650k UK deaths a year, ~3M in the US, dozens of organisations per estate. Measured cost ~£2–3 of agent time per estate; target £79–149 per case through funeral directors' aftercare. Empathy and Settld prove the category, and both stop at forms and email. Nobody makes the calls.
```

**Additional Information:**

```
Fastest path for judges: open https://afterward-lablab.vercel.app/board — no sign-in, the board starts replaying twelve real captured Voice Agent sessions on its own (holds compressed x8, labelled on screen). Watch for the REFUSED event on Harberton & Vale — that's the server-side validator refusing its own agent mid-call over a reference mismatch — and the amber "Needs you" card on Wessex, where the agent escalates to the family instead of guessing. Then open /ledger/est_holt for the evidence: verified references, documents requested, and the unedited stereo session recordings (institution on the left channel, Afterward on the right).

Everything is reproducible from the repo: "npm run verify" replays the captured dataset offline and asserts the doctrine held (8 checks, 0 unverified writes), and "npm run capture" re-runs all twelve calls live against the Voice Agent API with your own key. The protocol notes I wrote while building against the API are in docs/voice-agent-api-cheatsheet.md.

Built solo during the event. The README's "What's real and what isn't" section states exactly which parts are simulated and why: calling a real bank about a fictional death would be fraud, so the demo uses a labelled scripted test bed, and the roadmap starts with the legitimate real-world call — phoning real bereavement lines to ask what they'd need from a family.

The 3:23 video and the deck are in the repo under docs/ as well as uploaded here.
```

**Category:** Agent Builder track - The INTERNET OF AGENTS
**Tech tags:** AssemblyAI (if listed), Vercel, Anthropic Claude, Claude Code, rest api

---


**Title:** Afterward — the calls after a death, made for you

**Short description (≤ ~200 chars):**
One conversation with the family, then a voice agent phones every bank, insurer, utility and pension — waits on hold, says it's an AI, and returns a verified case reference + recording per account.

**Short description (≤150 chars fallback):**
A voice agent that makes the calls after a death — holds, menus, clerks — and returns a verified case reference and recording for every account.

**Long description:**
When someone dies in the UK, the government's Tell Us Once service notifies every government department with one form. Then GOV.UK tells the family, in its own words: "You'll also need to tell organisations outside government, like employers and private pension providers, banks, and utility companies." So the family spends the worst week of their lives in phone queues, repeating the death to a dozen call centres.

Afterward makes those calls instead. One short conversation with the executor, and it phones each institution: presses the menu keys (a press_key DTMF tool), sits through the hold without babbling (the orchestrator suppresses audio until a human answers), opens by saying it's an AI calling with the family's permission, states only facts from the family's brief, and records the outcome through a validated tool. A server-side check compares every reference against what the clerk actually said and refuses anything that doesn't match — it refused its own agent once, mid-call, on a real captured session, then recovered on the same call. Anything the family didn't provide becomes an amber "Needs you" card instead of a guess. Every call ends with the sponsor-side stereo recording (institution on the left channel, agent on the right), a timeline, and a verified reference in a shareable Estate Ledger.

Measured on the seeded estate at full-length holds: 12 calls, 12/12 references verified, 0 unverified writes, 2 escalations instead of guesses, 1 validator refusal recovered, 9m47s of hold endured. `npm run verify` reproduces the checks offline.

Being straight about the demo: the twelve institutions are a fictional, labelled, deterministic test bed modelled on real bereavement lines. Calling a real bank about a fictional death would be fraud, so I refuse to demo it. Everything the agent did on those calls was real. Green means what a first human call achieves — case opened, documents requested — never "done".

Why it's a business: 650k UK deaths a year, ~3M in the US, dozens of organisations per estate. Measured cost is £2–3 of agent time per estate; the plan is £79–149 per case through funeral directors' aftercare, where the budget already exists. Empathy (~$90M+ raised) and Settld prove the category, and both stop at forms and email. Nobody makes the calls.

**Technology tags:** AssemblyAI, Vercel, Next.js, Claude Code
**Category tags:** Voice Agents, Productivity, Social Good
**Demo platform:** Vercel
**Application URL:** https://afterward-lablab.vercel.app
**GitHub:** https://github.com/pinectar/afterward
**Video:** docs/afterward-demo.mp4 (MP4, 3:23 — above the 3:00 rubric floor, under 5:00)
**Slides:** docs/deck/afterward-deck.pdf
**Cover image:** docs/cover.png (1600×900)

**NOTE:** if any capture is re-run, refresh the proof numbers in README, deck slide 5, and this file — `npm run verify` now asserts totals match the raw runs.
