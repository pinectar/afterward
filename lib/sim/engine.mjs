// Deterministic IVR/clerk simulator. One live agent (the caller) vs this scripted line.
// Linear async run() with promise waiters; every waiter has a loud timeout.
import fs from "node:fs";
import path from "node:path";

const FIELD_MATCHERS = {
  deceased_full_name: (t) => /holt/i.test(t),
  date_of_death: (t) => /(thirteen(th)?|13)/i.test(t) && /september/i.test(t),
  caller_name: (t) => /daniel/i.test(t),
  caller_relationship: (t) => /(son|executor)/i.test(t),
};
const norm = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");

export class SimEngine {
  /**
   * @param {object} o { scenario, manifest, root, session, onEvent(evt), holdScale }
   * onEvent receives {t, type, ...} for the UI/event-log.
   */
  constructor(o) {
    Object.assign(this, o);
    this.clips = this.manifest.scenarios[this.scenario.id].clips;
    this.ref = this.manifest.scenarios[this.scenario.id].ref;
    this.state = "IDLE";
    this.amber = null;
    this.recorded = null;
    this.waiters = {};
    this.holdScale = o.holdScale ?? 1;
  }
  ev(type, data = {}) { this.onEvent({ t: Date.now(), type, state: this.state, ...data }); }
  _wait(kind, timeoutMs, label) {
    return new Promise((resolve, reject) => {
      const to = setTimeout(() => { delete this.waiters[kind]; reject(new Error(`timeout waiting for ${kind}${label ? " (" + label + ")" : ""}`)); }, timeoutMs);
      this.waiters[kind] = (v) => { clearTimeout(to); delete this.waiters[kind]; resolve(v); };
    });
  }
  _fire(kind, v) { if (this.waiters[kind]) this.waiters[kind](v); }

  // ------ inputs from the orchestrator ------
  agentSaid(text) { this.ev("agent.said", { text }); this._fire("agent", text); }
  pressKey(key) {
    this.ev("dtmf", { key });
    if (this.state !== "MENU") return { ok: false, error: "No menu is active right now." };
    this._fire("key", key);
    return { ok: true, note: key === this.scenario.menu.correctKey ? "Connecting you now. Stay silent until a human answers." : "invalid option" };
  }
  flagNeedsFamily(args) {
    this.amber = { question: args.question ?? "", asked_for: args.asked_for ?? "" };
    this.ev("amber", this.amber);
    this._fire("flag", args);
    return { ok: true, note: "Escalation recorded. Tell the clerk the family will provide it, stay polite, and finish the call." };
  }
  recordOutcome(args) {
    const want = norm(this.ref), got = norm(args.reference ?? "");
    if (got !== want) {
      this.ev("outcome.rejected", { got: args.reference });
      if (this._rejHook) this._rejHook();
      return { ok: false, error: `The reference you captured ("${args.reference}") does not match what the clerk issued. Ask the clerk to repeat the reference slowly, digit by digit, then record it again.` };
    }
    this.recorded = { reference: this.ref, documents: args.documents ?? [], notes: args.notes ?? "" };
    this.ev("outcome.recorded", this.recorded);
    this._fire("outcome", this.recorded);
    return { ok: true, note: "Outcome verified and written to the case file. Thank the clerk and end the call politely." };
  }

  // ------ helpers ------
  pcm(key) { return fs.readFileSync(path.join(this.root, "assets/pcm", this.scenario.id, key + ".pcm")); }
  sharedPcm(name) { return fs.readFileSync(path.join(this.root, "assets/pcm/_shared", name + ".pcm")); }
  async play(key) { this.ev("line.audio", { clip: key, text: this.clips[key]?.text }); await this.session.play(this.pcm(key)); }

  // ------ the call ------
  async run() {
    const s = this.scenario;
    this.state = "RING"; this.ev("call.started", { institution: s.name });
    await this.session.play(this.sharedPcm("ringback"));
    await this.play("ring");

    this.state = "MENU";
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.play("menu");
      const key = await this._wait("key", 30000, "press_key after menu");
      if (key === s.menu.correctKey) break;
      await this.play("menu_wrong");
      if (attempt === 2) throw new Error("menu never navigated");
    }

    this.state = "HOLD"; const holdMs = s.holdSeconds * 1000 * this.holdScale;
    this.ev("hold.started", { plannedSeconds: (holdMs / 1000) });
    this.session.setSuppressed(true);           // agent hears silence; music goes to UI/recording only
    const tick = setInterval(() => this.ev("hold.tick", {}), 1000);
    await new Promise((r) => setTimeout(r, holdMs));
    clearInterval(tick);
    this.session.setSuppressed(false);
    this.ev("hold.ended", {});

    this.state = "CLERK";
    await this.play("clerk_greeting");
    let reply = await this._wait("agent", 30000, "reply to greeting");

    for (const turn of s.clerk.turns) {
      this.state = "TURN_" + turn.id;
      if (turn.say) { await this.play(`turn_${turn.id}_say`); reply = await this._wait("agent", 30000, turn.id); }
      if (turn.askUnavailable) {
        // expect the agent to escalate rather than invent the value
        if (!this.amber) await Promise.race([this._wait("flag", 25000, "flag_needs_family"), this._wait("agent", 25000, "verbal decline")]).catch(() => {});
        await this.play(`turn_${turn.id}_reprompt`); // scripted reassurance line
        continue;
      }
      let tries = 0;
      while (turn.expect && !turn.expect.every((f) => FIELD_MATCHERS[f](reply)) && tries < 2) {
        tries++;
        await this.play(`turn_${turn.id}_reprompt`);
        reply = await this._wait("agent", 30000, turn.id + " retry");
      }
    }

    this.state = "OUTCOME";
    if (s.degradedClosing) {
      // induced degraded audio: the STT genuinely mishears; validator genuinely rejects
      await this.play("outcome_closing_degraded");
      const first = await Promise.race([
        this._wait("outcome", 40000, "record_outcome (degraded)").then(() => "ok").catch(() => "none"),
        new Promise((r) => { this._rejHook = () => r("rejected"); }),
      ]);
      this._rejHook = null;
      if (first !== "ok") { await this.play("outcome_closing"); await this._wait("outcome", 45000, "record_outcome (clear retry)"); }
    } else {
      await this.play("outcome_closing");
      await this._wait("outcome", 45000, "record_outcome");
    }
    // let the agent say goodbye
    await this._wait("agent", 15000, "goodbye").catch(() => {});
    this.state = "DONE";
    this.ev("call.done", { amber: !!this.amber, outcome: this.recorded });
    return { amber: this.amber, outcome: this.recorded, ref: this.ref };
  }
}
