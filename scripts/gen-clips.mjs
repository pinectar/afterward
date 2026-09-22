#!/usr/bin/env node
// Generates the full audio clip library for the IVR simulator.
// Sources: lib/sim/scenarios/*.json + the seeded estate (for deterministic refs).
// Output: public/clips/<scenario>/<key>.mp3 (UI playback) + assets/pcm/<scenario>/<key>.pcm
// (s16le 16kHz mono, for streaming into the Voice Agent session) + assets/clips/manifest.json
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SCEN_DIR = path.join(ROOT, "lib/sim/scenarios");
const PUB = path.join(ROOT, "public/clips");
const PCM = path.join(ROOT, "assets/pcm");
const CACHE = path.join(ROOT, "assets/tts-cache");
for (const d of [PUB, PCM, CACHE]) fs.mkdirSync(d, { recursive: true });

// deterministic per-institution reference numbers (seeded, stable across builds)
export function refFor(prefix) {
  const h = createHash("sha256").update("afterward-est_holt-" + prefix).digest();
  return `${prefix}-${(h.readUInt16BE(0) % 9000) + 1000}`;
}
const spokenRef = (ref) => ref.replace("-", ", ").split("").join(" ").replace(/ ,/g, ",");

const TEL_FILTER = "highpass=f=300,lowpass=f=3400,aformat=sample_rates=24000:channel_layouts=mono";
const IVR_FILTER = "acrusher=bits=12:mode=log:mix=0.25," + TEL_FILTER;

function tts(text, voice, outWav) {
  const key = createHash("sha256").update(voice + "|" + text).digest("hex").slice(0, 16);
  const cached = path.join(CACHE, key + ".mp3");
  if (!fs.existsSync(cached)) {
    execFileSync("edge-tts", ["--voice", voice, "--text", text, "--write-media", cached], { stdio: "pipe" });
  }
  return cached;
}
function render(text, voice, filter, scenId, lineKey) {
  const raw = tts(text, voice);
  const pubDir = path.join(PUB, scenId); const pcmDir = path.join(PCM, scenId);
  fs.mkdirSync(pubDir, { recursive: true }); fs.mkdirSync(pcmDir, { recursive: true });
  const mp3 = path.join(pubDir, lineKey + ".mp3");
  const pcm = path.join(pcmDir, lineKey + ".pcm");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-af", filter, mp3]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-af", filter, "-f", "s16le", "-acodec", "pcm_s16le", "-ar", "24000", "-ac", "1", pcm]);
  const dur = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).toString());
  return { mp3: `/clips/${scenId}/${lineKey}.mp3`, pcm: `assets/pcm/${scenId}/${lineKey}.pcm`, seconds: Math.round(dur * 100) / 100, text };
}

// shared assets: UK ringback + hold music pcm
function shared() {
  const dir = path.join(PCM, "_shared"); fs.mkdirSync(dir, { recursive: true });
  const ring = path.join(dir, "ringback.pcm");
  if (!fs.existsSync(ring)) execFileSync("bash", ["-c",
    `ffmpeg -y -loglevel error -f lavfi -i "sine=frequency=400:duration=3" -f lavfi -i "sine=frequency=450:duration=3" -filter_complex "[0][1]amix=inputs=2,volume='if(lt(mod(t,3),0.4)+between(mod(t,3),0.6,1.0),0.4,0)':eval=frame,${TEL_FILTER}" -f s16le -acodec pcm_s16le -ar 16000 -ac 1 ${ring}`]);
  const hold = path.join(dir, "hold_music.pcm");
  if (!fs.existsSync(hold)) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(ROOT, "assets/clips/hold_music.wav"), "-f", "s16le", "-acodec", "pcm_s16le", "-ar", "24000", "-ac", "1", hold]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(ROOT, "assets/clips/hold_music.wav"), path.join(PUB, "hold_music.mp3")]);
}

const manifest = { generated: new Date().toISOString(), scenarios: {} };
shared();
for (const f of fs.readdirSync(SCEN_DIR).filter((f) => f.endsWith(".json"))) {
  const s = JSON.parse(fs.readFileSync(path.join(SCEN_DIR, f)));
  const ref = refFor(s.outcome.refPrefix);
  const closing = s.outcome.closing.replace("{REF}", spokenRef(ref));
  const lines = {
    ring: [s.ring.prompt, s.ivrVoice, IVR_FILTER],
    menu: [s.menu.prompt, s.ivrVoice, IVR_FILTER],
    menu_wrong: [s.menu.wrongKeyPrompt, s.ivrVoice, IVR_FILTER],
    hold_announce: [s.holdAnnouncement, s.ivrVoice, IVR_FILTER],
    clerk_greeting: [s.clerk.greeting, s.clerkVoice, TEL_FILTER],
    outcome_closing: [closing, s.clerkVoice, TEL_FILTER],
    // degraded variant: genuinely bad line quality so STT genuinely mishears the ref
    ...(s.degradedClosing ? { outcome_closing_degraded: [closing, s.clerkVoice, "atempo=1.35,acrusher=bits=6:mode=log:mix=0.6,highpass=f=500,lowpass=f=2400,volume=0.8,aformat=sample_rates=24000:channel_layouts=mono"] } : {}),
  };
  for (const t of s.clerk.turns) {
    if (t.say) lines[`turn_${t.id}_say`] = [t.say, s.clerkVoice, TEL_FILTER];
    lines[`turn_${t.id}_reprompt`] = [t.reprompt, s.clerkVoice, TEL_FILTER];
  }
  manifest.scenarios[s.id] = { name: s.name, ref, holdSeconds: s.holdSeconds, clips: {} };
  for (const [key, [text, voice, filter]] of Object.entries(lines)) {
    manifest.scenarios[s.id].clips[key] = render(text, voice, filter, s.id, key);
    process.stdout.write(".");
  }
  console.log(" " + s.id);
}
fs.writeFileSync(path.join(ROOT, "assets/clips/manifest.json"), JSON.stringify(manifest, null, 2));
console.log("manifest written:", Object.keys(manifest.scenarios).length, "scenarios");
