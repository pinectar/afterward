// Single source of truth for the deterministic IVR/clerk simulator.
// Consumed by: scripts/gen-clips.mjs (asset generation), lib/sim/engine.ts (runtime), fixtures.

export type InstitutionKind = "bank" | "utility" | "insurer" | "pension" | "telecom" | "council";

export interface MenuNode {
  prompt: string;          // spoken by IVR voice
  correctKey: string;      // DTMF the agent must press
  wrongKeyPrompt: string;  // spoken on any other key
}

export type RequiredField =
  | "deceased_full_name"
  | "date_of_death"
  | "caller_name"
  | "caller_relationship";

export interface ClerkTurn {
  /** state id */
  id: string;
  /** what the clerk says entering this state */
  say: string;
  /** fields the agent's reply must contain to advance (matched deterministically) */
  expect?: RequiredField[];
  /** if set, clerk asks for a field the family did NOT provide -> agent must escalate (amber) */
  askUnavailable?: "account_number" | "policy_number" | null;
  /** next state on success */
  next: string | "OUTCOME";
  /** spoken when expectation unmet */
  reprompt: string;
}

export interface Outcome {
  type: "case_opened" | "needs_family";
  refPrefix: string;                 // e.g. "WBS" -> ref like WBS-4471
  documents: string[];               // requested documents read out by clerk
  closing: string;                   // clerk's closing line (may contain {REF})
}

export interface Scenario {
  id: string;
  name: string;                      // fictional, UK-flavoured, never a real brand
  kind: InstitutionKind;
  clerkVoice: string;                // edge-tts voice
  ivrVoice: string;
  holdSeconds: number;               // real elapsed hold, 20-90s
  ring: { prompt: string };          // recorded-line + queue announcement
  menu: MenuNode;
  holdAnnouncement: string;          // periodic line over hold music
  clerk: { greeting: string; turns: ClerkTurn[] };
  outcome: Outcome;
  /** scripted quirk for this institution, shown in UI copy */
  quirk?: string;
}
