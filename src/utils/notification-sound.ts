/**
 * Crease in-app alert chime — short bat-tap + bright two-note ping.
 * Web Audio only (no asset file). Mobile browsers require a prior user gesture
 * to unlock; call unlockNotificationAudio() on first tap.
 */

let sharedCtx: AudioContext | null = null;
let lastPlayedAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  sharedCtx ??= new Ctx();
  return sharedCtx;
}

/** Call from a click/tap so iOS/Android allow later autoplay of the chime. */
export async function unlockNotificationAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // Ignore — next play attempt may still work after another gesture.
    }
  }
}

function tone(
  ctx: AudioContext,
  {
    frequency,
    start,
    duration,
    gain,
    type = "sine",
  }: {
    frequency: number;
    start: number;
    duration: number;
    gain: number;
    type?: OscillatorType;
  },
) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(env);
  env.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function softTap(ctx: AudioContext, start: number) {
  const frames = Math.floor(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    const t = i / frames;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 420;
  filter.Q.value = 0.8;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.22, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
  src.connect(filter);
  filter.connect(env);
  env.connect(ctx.destination);
  src.start(start);
}

/**
 * Plays the Crease notification identity sound.
 * Safe to call frequently — overlaps within 1.5s are skipped unless `force`.
 */
export async function playCreaseNotificationSound(
  opts: { force?: boolean } = {},
): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  await unlockNotificationAudio();
  if (ctx.state !== "running") return;

  const now = Date.now();
  if (!opts.force && now - lastPlayedAt < 1500) return;
  lastPlayedAt = now;

  const t0 = ctx.currentTime + 0.01;
  softTap(ctx, t0);
  // Distinct confirmation ping — soft rising tone.
  tone(ctx, {
    frequency: 587.33, // D5
    start: t0 + 0.04,
    duration: 0.18,
    gain: 0.12,
    type: "triangle",
  });
  tone(ctx, {
    frequency: 880, // A5
    start: t0 + 0.14,
    duration: 0.28,
    gain: 0.14,
    type: "sine",
  });
  tone(ctx, {
    frequency: 1318.5, // E6 soft overtone
    start: t0 + 0.16,
    duration: 0.22,
    gain: 0.045,
    type: "sine",
  });
}
