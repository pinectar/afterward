// Thin client for the AssemblyAI Voice Agent API WebSocket.
// Protocol per docs/voice-agent-api-cheatsheet.md (fetched 2026-09-22).
import WebSocket from "ws";
import { EventEmitter } from "node:events";

const WS_URL = "wss://agents.assemblyai.com/v1/ws";
const FRAME_MS = 50;
const BYTES_PER_FRAME = (24000 * 2 * FRAME_MS) / 1000; // 24kHz PCM16 mono

export class AgentSession extends EventEmitter {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.lastEvent = null;          // gate for tool.result timing
    this.pendingResults = [];       // queued tool.results awaiting reply.done
    this.queue = [];                // Buffers of PCM to stream as "user" audio
    this.cursor = 0;
    this.suppressed = false;        // hold suppression: stream silence instead of queue
    this.sessionId = null;
  }

  connect(sessionConfig) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL, { headers: { Authorization: `Bearer ${this.apiKey}` } });
      this.ws.on("error", reject);
      this.ws.on("close", (code) => this.emit("closed", code));
      this.ws.on("open", () => {
        this.ws.send(JSON.stringify({ type: "session.update", session: sessionConfig }));
      });
      this.ws.on("message", (raw) => {
        const ev = JSON.parse(raw.toString());
        this.emit("event", ev);
        switch (ev.type) {
          case "session.ready":
            this.sessionId = ev.session_id;
            this._startPacer();
            resolve(ev);
            break;
          case "reply.started":
          case "input.speech.started":
            this.lastEvent = ev.type;
            break;
          case "reply.done":
            this.lastEvent = "reply.done";
            if (ev.status === "interrupted") this.pendingResults = []; // drop stale results
            this._flushResults();
            this.emit("reply.done", ev);
            break;
          case "tool.call":
            this.emit("tool.call", ev);
            break;
          case "transcript.agent":
            this.emit("agent.final", ev);
            break;
          case "transcript.user":
            this.emit("user.final", ev);
            break;
          case "reply.audio":
            this.emit("agent.audio", Buffer.from(ev.data, "base64"));
            break;
          case "session.error":
            this.emit("protocol.error", ev);
            break;
          case "session.ended":
            this.emit("ended", ev);
            break;
        }
      });
    });
  }

  /** Continuous real-time pacing: one 50ms frame per tick; silence when queue empty or suppressed. */
  _startPacer() {
    const silence = Buffer.alloc(BYTES_PER_FRAME);
    this.pacer = setInterval(() => {
      if (this.ws.readyState !== WebSocket.OPEN) return;
      let frame;
      if (this.suppressed || this.queue.length === 0) {
        frame = silence;
      } else {
        const head = this.queue[0];
        frame = head.subarray(this.cursor, this.cursor + BYTES_PER_FRAME);
        this.cursor += BYTES_PER_FRAME;
        if (this.cursor >= head.length) { this.queue.shift(); this.cursor = 0; }
        if (frame.length < BYTES_PER_FRAME) frame = Buffer.concat([frame, Buffer.alloc(BYTES_PER_FRAME - frame.length)]);
      }
      this.ws.send(JSON.stringify({ type: "input.audio", audio: frame.toString("base64") }));
    }, FRAME_MS);
  }

  /** Enqueue PCM (Buffer) to be heard by the agent; resolves when fully streamed. */
  play(pcm) {
    this.queue.push(pcm);
    const ms = (pcm.length / BYTES_PER_FRAME) * FRAME_MS;
    return new Promise((r) => setTimeout(r, ms + 2 * FRAME_MS));
  }

  setSuppressed(v) { this.suppressed = v; }

  sendToolResult(callId, result, isError = false) {
    this.pendingResults.push({ type: "tool.result", call_id: callId, result: JSON.stringify(result), is_error: isError });
    this._flushResults();
  }
  _flushResults() {
    if (this.lastEvent !== "reply.done") return;
    while (this.pendingResults.length) this.ws.send(JSON.stringify(this.pendingResults.shift()));
  }

  updateSession(patch) { this.ws.send(JSON.stringify({ type: "session.update", session: patch })); }

  async end() {
    clearInterval(this.pacer);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "session.end" }));
      await new Promise((r) => { this.once("ended", r); setTimeout(r, 3000); });
      this.ws.close(1000);
    }
  }
}
