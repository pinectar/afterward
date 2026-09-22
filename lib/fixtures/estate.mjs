// The one seeded estate. All dynamic clip content derives from these values,
// so every clerk line is known at asset-generation time (fully deterministic sim).
export const ESTATE = {
  id: "est_holt",
  deceased: { fullName: "Margaret Rose Holt", spelling: "H-O-L-T", dob: "1941-03-12", dod: "2026-09-13", dodSpoken: "the thirteenth of September, twenty twenty-six" },
  executor: { name: "Daniel Holt", relationship: "son and executor" },
  // fields the family did NOT provide — the agent must never invent these:
  unavailable: ["account_number", "policy_number"],
};
