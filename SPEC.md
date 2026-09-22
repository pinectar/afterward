# Afterward — Product Spec (canonical requirements, v1 locked 2026-09-22)

**One sentence:** Afterward makes the dozens of phone calls that follow a death — banks, insurers, utilities, pensions — from one conversation with the family, waits on hold, and returns a case reference + call recording for every institution. It never guesses: missing information flips a card amber and asks the family.

**Event:** AssemblyAI Voice Agent Hackathon (lablab.ai). Deadline **Sep 30 2026, 8:30 PM IST**. 5 equal winners. Rubric (equal weight): Presentation / Business Value / Application of Technology / Originality. Async judging: <5-min video (MUST be >3 min — tier-2 punishes shorter), PDF deck, live URL (Vercel), public GitHub (MIT).

## Non-negotiable product doctrine
1. **Green ≠ done.** Green card = "Case opened — reference issued, documents requested (death certificate, proof of executorship)". Notification ≠ settlement. This matches what a real first human call achieves.
2. **Never guess.** Any value the agent cannot trace to the family's words, or that a validator rejects, flips the card AMBER ("Needs you") with the exact audio moment + the question to answer. No code path writes an unverified value.
3. **AI disclosure first.** Every outbound call opens by disclosing it is an AI assistant calling on the family's behalf (EU AI Act Art. 50(1), in force 2 Aug 2026; fines €15M/3% Art. 99(4)(g)) + recording disclosure.
4. **Honest simulation.** The 12 demo institution lines are a labeled, deterministic IVR test bed modeled on real bereavement scripts. On-screen label always visible. One REAL unedited requirements-discovery call (asking a real institution's public bereavement line what documents they require — never filing a fictional death) is the credibility anchor. Real-call video: IVR/hold audio ducked, human side shown as transcript, institution unnamed.
5. **Ethics rails:** never call a real institution with a fictional death; judge-phone demo has premium-prefix blocklist, geo allowlist (graceful +91/unsupported fallback), 1 call/number/hour, per-IP limit, daily cap, kill switch, fictional-scenario script only.
6. **Jurisdiction:** UK-led story (Tell Us Once covers government only — GOV.UK verified 2026-09-22; Death Notification Service covers member banks only; Afterward orchestrates everything else and can file DNS for banks). Institution names fictional and UK-flavored (e.g. "Wessex Building Society"), never real brands.

## Architecture (bug-fixed, locked)
- **One live agent only.** Afterward's caller = AssemblyAI Voice Agent API WebSocket session. The institution side = **deterministic IVR simulator** (scripted state machine: menu prompts [espeak-style robotic TTS], hold music [self-generated, royalty-free], clerk lines [pre-generated natural TTS]). NEVER two live agents bridged (turn-taking deadlock).
- **Orchestrator owns:** audio piping (resample as needed), **hold-state suppression** (classify hold music/announcements; withhold audio from the agent during hold; release on live-human detection — this is the flagship realtime moment), **press_key DTMF client tool** (agent decides, orchestrator executes; sim = state transition, real calls = Twilio sendDigits), per-call run lifecycle, event stream to UI.
- **Calls ≤ ~3.5 min each** (hold segments 30–90s real time — honest timers, no fake clocks) so serverless duration limits are safe; bridge can move to a persistent host if needed.
- **AssemblyAI features (load-bearing):** Voice Agent API (caller), per-call keyterms/transcription prompt (deceased's name spelling, refs), client-side tools (validators that refuse + press_key + record_outcome), turn detection/interruption handling, session history (recording + timeline = evidence), webhooks (session lifecycle), LLM Gateway structured outputs + fallbacks (per-call outcome JSON), PII redaction concepts on the evidence pack.
- **Stack:** Next.js (App Router, TS, Tailwind) on Vercel; Supabase (Postgres + Realtime) for runs/cards/events; Node orchestrator (start as a local/route-handler worker; ≤3.5-min calls); seeded demo mode (`?demo=true`) replays captured runs with zero live dependencies — the default judge path.
- **Mid-call UI events come from OUR orchestrator** (Supabase Realtime), not sponsor webhooks (those fire only at session start/end).

## Demo world (R17/R18)
- `scripts/seed.ts` produces the fixed estate "Margaret Holt" + 12 institution cards + 2 scripted fault scenarios: (a) missing account number → amber "Needs you"; (b) captured mishear: date of death 13th vs 30th → validator rejects → agent re-asks (replayed capture, labeled — never presented as live).
- `npm run verify` = mock-mode end-to-end: seeded run → asserts card states, amber count, 0 unverified writes, evidence pack fields present. PASS/FAIL printout.
- Proof numbers measured on the seeded set (N calls, hold time endured, outcomes evidence-linked, escalations, 0 fabricated confirmations across replays).

## Surfaces
1. **Landing page** (product info: problem, how it works, doctrine, evidence pack sample, honest "what's real vs simulated", CTA to live board). REQUIRED by user.
2. **Live board** — the demo: intake summary, 12 cards (grey→calling[hold timer, live transcript ticker]→green/amber), audible call playback, "SIMULATED TEST BED" label, judge-phone beat entry (feature-flagged; graceful fallback), Estate Ledger link.
3. **Estate Ledger** — shareable read-only evidence page per estate (per institution: status, ref, documents requested, quote + timestamp, audio clip, redaction notice).
4. **The real call exhibit** — the one unedited requirements-discovery call, presented per doctrine #4.

## Deliverables checklist (T-24h = Sep 29)
Video 3:30–4:30 (hook ≤12s; product by 0:30; amber moment; real call BEFORE judge-phone beat; slides ≤45s) · PDF deck (market UK-led + US sizing, competitive: Empathy/Settld/DNS/Tell-Us-Once, revenue: funeral-director aftercare B2B + per-estate B2C, roadmap, limitations) · README hero (criteria-mapped evidence table, what's real vs simulated, 3-command quickstart) · MIT LICENSE · live Vercel URL (demo mode default) · fresh public repo, secret-scanned · new lablab team (NOT Rollcall's) · tags: AssemblyAI, Vercel, Supabase.

## Open items
- [ ] Voice Agent API: confirm audio format/sample rate, session.update capabilities, temporary token flow (docs fetch before bridge code)
- [ ] Concurrency limit on account (open 6 sessions test)
- [ ] AssemblyAI credit balance check before 25-replay measurement day
- [ ] Discord: can one account field two teams? (decides if Rollcall stays up)
- [ ] "Afterward" name-collision scan; "dozens of calls" citable figure (Settld/Empathy stats) or say "dozens"
- [ ] Twilio paid acct for judge-phone + real requirements call (voice needs no A2P; geo-permissions)
