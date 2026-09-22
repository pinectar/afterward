# Afterward — agent notes

Built solo with Claude Code (Opus/Fable) during the AssemblyAI Voice Agent Hackathon, Sep 2026.
AI wrote most of the code under review; architecture decisions are in SPEC.md, protocol contract in
docs/voice-agent-api-cheatsheet.md. The captured dataset in fixtures/ is real API output, not generated text.

Rules for agents working here:
- SPEC.md is the requirements source of truth. The doctrine section is non-negotiable.
- Never bias STT with ground-truth values (no expected references in keyterms).
- Never call a real institution with a fictional death. The sim is the demo; label it.
- fixtures/ and public/recordings/ are captured evidence — regenerate via scripts/run-all.mjs, never edit by hand.
