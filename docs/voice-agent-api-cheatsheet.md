# AssemblyAI Voice Agent API — Protocol Cheat Sheet

Source: assemblyai.com/docs/voice-agents/voice-agent-api (+ message-sequence,
session-configuration, tools/client-side-tools, audio-format,
turn-detection-and-interruptions, api-spec/generate-voice-agent-token,
session-history, events-reference). Fetched 2026-09-22. All names/values quoted
verbatim from the docs.

## 1. Endpoints & Auth

- WebSocket: `wss://agents.assemblyai.com/v1/ws`
- REST base URL: `https://agents.assemblyai.com`
- WebSocket auth, two options ("WebSocket connect (Authorization or ?token=)"):
  - Server-side: header `Authorization: Bearer YOUR_KEY`
  - Browser/client-side: temporary token passed "as the `token` query
    parameter when opening the WebSocket"
- REST auth: API key in the `Authorization` header ("a `Bearer ` prefix is
  accepted and stripped").

### Token generation (temporary token)

`GET https://agents.assemblyai.com/v1/token` with `Authorization: Bearer YOUR_API_KEY`

Query parameters:

| Param | Required | Constraints | Notes |
| --- | --- | --- | --- |
| `expires_in_seconds` | Yes | integer, 1–600 | "Token redemption window" — must open the WS within it; does NOT cap session length. If elapsed, first frame is `session.error` code `unauthorized` instead of `session.ready`. |
| `max_session_duration_seconds` | No | integer, 60–10800, default `10800` | Max session length. "There is no 'closing soon' warning event" — run your own client-side timer. |

Response `200`:

```json
{ "token": "your-temporary-token", "expires_in_seconds": 300 }
```

Errors: `400`, `401`, `429` (rate limit), `500`, each shaped
`{ "error": string, "code": string, "details": object }`.
"Each token is one-time use and can only be used for a single session."
"Always fetch a fresh token immediately before each connection attempt"
(pre-handshake failures surface in browsers as close code `1006` with no
`session.error`).

## 2. Message sequence (canonical order)

Client → server events: `session.update`, `session.resume`, `input.audio`,
`tool.result`, `reply.create`, `conversation.message`, `session.end`.

Server → client events: `session.ready`, `session.updated`,
`input.speech.started`, `transcript.user.delta`, `input.speech.stopped`,
`transcript.user`, `reply.started`, `reply.audio`, `transcript.agent.delta`,
`transcript.agent`, `tool.call`, `reply.done`, `session.ended`, `session.error`.

```text
C→S  WebSocket connect (Authorization or ?token=)
C→S  session.update            (agent_id OR inline system_prompt/tools/input/output)
S→C  session.ready             (save session_id)
loop while conversing:
  C→S  input.audio (stream)    (base64 PCM16, ~50 ms chunks; ONLY after session.ready)
  S→C  input.speech.started
  S→C  transcript.user.delta   xN (partials)
  S→C  input.speech.stopped
  S→C  transcript.user         (final)
  S→C  reply.started
  S→C  reply.audio             xN
  S→C  transcript.agent.delta  xN (word-level, audio-aligned)
  S→C  transcript.agent        (after ALL reply audio delivered)
  [tool call flow]
  S→C  tool.call               (arguments is a dict)
  S→C  reply.done              <- send tool.result here
  C→S  tool.result
  S→C  reply.started ... reply.audio xN ... transcript.agent
  S→C  reply.done
C→S  session.end
S→C  session.ended
S→C  WebSocket close (1000)
```

Ordering rules (verbatim): "Do not send `input.audio` before `session.ready`.
Audio sent before the session is established is discarded." / "Always send
`session.end` before closing the WebSocket."

## 3. Inline session configuration (`session.update`)

First message after connect; resendable mid-session for mutable fields. Every
field optional. Stored-agent alternative: `{ "agent_id": "<id>" }` as the only
field in the first `session.update` — "mutually exclusive with the inline
fields" (violations raise `agent_id_not_first`).

```json
{
  "type": "session.update",
  "session": {
    "system_prompt": "You are a friendly support agent. Keep responses under 2 sentences.",
    "greeting": "Hi! How can I help you today?",
    "tools": [],
    "input": {
      "format": { "encoding": "audio/pcm" },
      "keyterms": ["AssemblyAI", "Universal"],
      "transcription_mode": "balanced",
      "transcription_prompt": "Expect product names and order IDs.",
      "language_codes": ["en"],
      "voice_focus": "near-field",
      "voice_focus_threshold": 0.5,
      "turn_detection": {
        "vad_threshold": 0.5,
        "min_silence": 1000,
        "max_silence": 3000,
        "interrupt_response": true,
        "interruption_delay": 100
      }
    },
    "output": {
      "voice": "alba",
      "format": { "encoding": "audio/pcm" },
      "volume": 100
    }
  }
}
```

Field notes:

- `system_prompt` — personality/behavior. Mutable mid-session.
- `greeting` — "the exact words spoken on connect, sent straight to TTS."
  Immutable after `session.ready`.
- `output.voice` — TTS voice, e.g. `"alba"` (stored-agent REST shape uses
  `"voice": { "voice_id": "alba" }`; docs also show `"anna"`). Immutable.
- `output.volume` — `0` (silent) to `100` (loudest). Mutable mid-session.
- `input.keyterms` — "up to 100 transcription-bias terms." Mutable.
- `input.transcription_mode` — `min_latency` | `balanced` (default) |
  `max_accuracy`. Mutable (docs suggest switching per call stage).
- `input.transcription_prompt` — biases transcription, "max 1750 characters." Mutable.
- `input.language_codes` — array; "omit for automatic detection." Accepted
  mid-session but "applied on the next speech-to-text reconnect."
- `input.voice_focus` — `near-field` (default) | `far-field`;
  `voice_focus_threshold` `0.0`–`1.0`, default `0.85`. Set at connect.
- `tools` — see §5. Updates REPLACE the previous array, not merge.

Mutability after `session.ready`: mutable = `system_prompt`,
`input.turn_detection`, `input.keyterms`, `input.transcription_mode`,
`input.transcription_prompt`, `output.volume` (plus `tools`/`input.format`
accepted without error). Immutable (raise `session.error` code
`immutable_field`; rejected change ignored): `greeting`, `output.voice`,
`output.format`.

Ack: server replies `session.updated` with the full resolved `config`.

## 4. Audio

"All audio is **base64-encoded and mono**." Input and output configured
independently. NOT binary WebSocket frames — always base64 inside JSON events.

| Encoding | Sample rate | Bit depth |
| --- | --- | --- |
| `audio/pcm` (default) | 24,000 Hz | 16-bit signed integer (little-endian) |
| `audio/pcmu` | 8,000 Hz | 8-bit μ-law (G.711, telephony) |
| `audio/pcma` | 8,000 Hz | 8-bit A-law (G.711, telephony) |

Format fields: `input.format.encoding`, `output.format.encoding`,
`format.sample_rate` (integer Hz, "Determined by the encoding if omitted").

Input — send continuously, "Chunk size doesn't matter; ~50 ms works well":

```json
{ "type": "input.audio", "audio": "<base64-encoded PCM16>" }
```

Three rules (verbatim gist): wait for `session.ready`; "Send at real time, not
faster" — "Frames beyond about one second of audio per second of wall clock are
dropped, not buffered" (streaming faster raises `audio_rate_violation`); "Send
raw mic audio" — server denoises already, client-side RNNoise/Krisp adds
artifacts.

Output — arrives as `reply.audio` events; note the field is `data`, not `audio`:

```json
{ "type": "reply.audio", "data": "<base64-encoded PCM16>" }
```

Write chunks straight into an output buffer (24,000 Hz mono int16 for
`audio/pcm`; 8,000 Hz for pcmu/pcma); don't pace playback with `sleep`.

## 5. Client-side tools

Declared inline in `session.tools` with `"type": "function"`:

```json
{
  "type": "function",
  "name": "get_weather",
  "description": "Get current weather for any city. Use this whenever the user asks about weather.",
  "parameters": {
    "type": "object",
    "properties": { "location": { "type": "string", "description": "City name, e.g. London" } },
    "required": ["location"]
  },
  "execution_mode": "interactive",
  "timeout_seconds": 120
}
```

| Field | Default | Notes |
| --- | --- | --- |
| `type` | (required) | Always `"function"`. |
| `name` | (required) | snake_case, verb-noun. Referenced by `tool.call`. |
| `description` | `""` | The model's main signal for when to call. |
| `parameters` | `{}` | JSON Schema. NOT validated at `session.update` time — malformed schemas "are accepted silently and break tool calling at runtime." |
| `execution_mode` | `"interactive"` | `"interactive"` or `"hold"`. |
| `timeout_seconds` | `120` | 1–300. "On timeout the agent apologises; the session continues." |

`tool.call` (server → client; "`arguments` is a dict, ready to use directly"):

```json
{ "type": "tool.call", "call_id": "call_abc123", "name": "get_weather", "arguments": { "location": "Tokyo" } }
```

`tool.result` (client → server; `result` is a JSON *string*):

```json
{
  "type": "tool.result",
  "call_id": "call_abc123",
  "result": "{\"temp_c\": 22, \"description\": \"Sunny\"}",
  "is_error": false
}
```

`is_error`: optional, default `false`; "Set `true` to signal the tool call
failed so the agent can respond accordingly."

Turn-taking rule (verbatim): "**Send `tool.result` when `reply.done` is the
latest event you've received.** Not earlier (agent is still
mid-transition-phrase), not later (a new turn has started)." Pattern:
accumulate pending results on `tool.call`, track `last_event` on
`reply.started`/`input.speech.started`/`reply.done`, flush only when idle at
`reply.done`; if `reply.done` has `status: "interrupted"`, CLEAR pending
results ("agent moved on, drop stale results"). Sequence around a call:
`tool.call` → `reply.done` → you send `tool.result` → fresh `reply.started` …
`reply.done`. For tool-call replies, `reply_id` is `fc-<call_id>`.

Error content: put a string in an `error` field of the result — it "is read
verbatim by the model." "Weak errors cause guessing loops; specific errors get
clean recoveries" (name the failing field, say what did work, say what to ask
next).

## 6. Interruptions / barge-in

On by default; semantic — "Back-channels like 'uh-huh' or 'makes sense' don't
interrupt; 'wait, stop' does." On a true interruption the server stops
generating and emits:

- `reply.done` with `status: "interrupted"`
- `transcript.agent` with `interrupted: true` and `text` "trimmed to what the
  user actually heard"

Agent audio generation is cancelled server-side, but YOU must flush the local
playback buffer ("stop and clear your queued audio"), restart the playback
stream, and drop pending `tool.result`s. Docs recommend flushing on BOTH
`input.speech.started` ("snappiest barge-in") and interrupted `reply.done`.

`input.turn_detection` knobs (all optional; "Leave it on default"):

| Field | Default | Notes |
| --- | --- | --- |
| `vad_threshold` | `0.5` | 0.0–1.0. "Lower is more sensitive." |
| `min_silence` | adaptive | ms before confident end-of-turn. |
| `max_silence` | adaptive | ms before forcing end-of-turn. |
| `interrupt_response` | `true` | "Set `false` to disable barge-in entirely." |
| `interruption_delay` | per mode | 0–1000 ms before a barge-in can interrupt (`0` for `min_latency`, `500` for `balanced` and `max_accuracy`). |

Warning: "Setting `min_silence` or `max_silence` turns off the adaptive pacing
and entity-aware waiting … for the rest of the session."

## 7. Session history (Recordings & transcripts)

Base `https://agents.assemblyai.com`, API key in `Authorization` header.

- `GET /v1/sessions` — list, newest first, no artifacts. Params: `limit` (1–200,
  default 50), `cursor`, `status`, `agent_id`. Response: `sessions[]` with
  `id`, `agent_id`, `status`, `public_close_reason`, `duration_seconds`,
  `created_at`, `ended_at`; plus `has_more` and
  `response_metadata.next_cursor` (pass back as `cursor`).
- `GET /v1/sessions/{id}` — full session; adds `config` (system prompt, input/
  output, tools, llm) and `artifacts`: array of
  `{ "type": "audio" | "timeline" | "metadata", "url": "<pre-signed>", "content_type": ... }`.
  Empty while the session is active. Download artifact `url`s with NO
  Authorization header. "Artifact URLs expire after a short TTL. Store the
  `session_id`, not the URL."
- `DELETE /v1/sessions/{id}` — soft delete, returns `204`.

Recording (`audio` artifact): OGG/Opus, `"channels": 2`,
`"channel_layout": "stereo (left=user, right=agent)"`, `"sample_rate": 24000`.

Timeline artifact fields: `session_id`, `started_at_unix_ms`, `turns[]` with
`turn_id`, `item_id`, `status` (`completed`/`interrupted`), `trigger`
(`greeting`/`user_speech`), `user_transcript` (null on agent-initiated turns),
`user_confidence`, `agent_text`, `agent_reply_started_at_ms`,
`agent_reply_ended_at_ms`, `time_to_first_audio_ms`, and `tool_calls[]`
(`call_id`, `name`, `arguments`, `result`, `dispatched_at_ms`,
`result_received_at_ms`, `duration_ms`, `is_error`, plus `timed_out` in
parsing code). "Empty arrays are dropped from the JSON" — no `turns` key if no
one spoke, no `tool_calls` key on tool-less turns; default them when parsing.

## 8. Limits, keepalive, termination

- Keepalive/ping requirements: NOT FOUND IN DOCS (no ping/pong or heartbeat
  mentioned on any fetched page).
- Numeric rate/concurrency limits: NOT FOUND IN DOCS — only signals:
  token endpoint returns `429`; `session.error` codes `concurrency_exceeded`
  ("Your account's concurrent-session limit was reached"), `at_capacity`, and
  `audio_rate_violation` ("`input.audio` streamed faster than real time").
  Only `at_capacity`, `concurrency_exceeded`, `internal_error` are retryable;
  "every other code is fatal."
- Max session duration: `max_session_duration_seconds` 60–10800 (default 10800);
  on expiry `session_expired` (close code 1008), no warning event.
- Clean termination: send `{ "type": "session.end" }` → server flushes, emits
  `session.ended` (`session_duration_seconds`, `audio_duration_seconds` —
  null if you streamed none, `timestamp` epoch seconds) → closes WS with code
  `1000`. The `session_id` is dead immediately.
- Bare `ws.close()` instead: session held 30 s for `session.resume`, "and that
  30-second window is billable."
- Resume: `{ "type": "session.resume", "session_id": "sess_abc123" }` as first
  message on a new connection, within 30 s of a drop; expired/foreign IDs get
  `session_not_found` / `session_forbidden` / `session_expired`.
- `session.ready` carries `session_id`, `expires_at` (epoch seconds at max
  duration), `resume_token` ("May be empty"), and the full resolved `config`.
- `session.error` payload: `type`, `timestamp`, `code`, `message`, sometimes
  `param`. Close codes: `1008` (auth/resume/expiry), `1011` (internal; may
  close with NO `session.error` payload), `1000` (clean).

## Gotchas

1. Field-name asymmetry: client `input.audio` carries base64 in `"audio"`, but
   server `reply.audio` carries it in `"data"`.
2. Docs self-contradict on two payloads — trust the Events reference ("the
   field-level schema of each event"): message-sequence shows
   `transcript.user.delta` with a `"delta"` field and `session.error` with
   `"error_code"`; events-reference specifies `transcript.user.delta` uses
   `item_id` + `text` and `session.error` uses `code`.
3. `transcript.user.delta.text` is "the **full transcript so far**, not an
   incremental chunk" — render latest, never concatenate. But
   `transcript.agent.delta.delta` IS incremental (word-level, with
   `start_ms`/`end_ms`).
4. `tool.result.result` is a JSON *string* (double-encoded), while
   `tool.call.arguments` is a plain object.
5. Strict tool.result timing: only when `reply.done` is the latest event;
   your tool may finish before OR after `reply.done`, so flush from both
   handlers, and drop pending results on `status: "interrupted"`.
6. Closing the socket without `session.end` keeps billing for a 30 s resume
   grace window.
7. `session.tools` updates replace the whole array (no merge), and tool
   `parameters` schemas are not validated at `session.update` time — broken
   schemas fail silently at runtime.
8. `greeting`, `output.voice`, `output.format` are immutable after
   `session.ready` (`immutable_field` error); `output.volume` is mutable.
   `language_codes` / `voice_focus` changes are accepted but only apply "on
   the next speech-to-text reconnect."
9. Audio faster than ~1 s of audio per wall-clock second is dropped, not
   buffered — pace pre-recorded test clips.
10. `transcript.agent` arrives AFTER the final `reply.audio` chunk (usable as
    an end-of-playback signal).
11. No "closing soon" event before `max_session_duration_seconds` /
    `session_expired` — run your own timer.
12. Browser pre-handshake auth failures show up as close code `1006` with no
    `session.error`; mint a fresh one-time token right before every connect.
13. Voice field shape differs by surface: inline WS uses
    `output.voice: "alba"`; the stored-agent REST body uses
    `voice: { "voice_id": "alba" }`.
14. No echo cancellation = the agent hears its own TTS and interrupts itself
    (every reply ends `status: "interrupted"`); use headphones or a browser.
15. Session-history JSON omits empty arrays entirely (`turns`, `tool_calls`,
    even `artifacts` while active) — default them when parsing.
16. `agent_id` must be the ONLY field, in the FIRST `session.update`
    (`agent_id_not_first` otherwise).
