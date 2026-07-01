/**
 * Tiny offline Web Audio beep used to preview the countdown sound. No assets,
 * no network — synthesized on the fly so it works fully offline.
 */
export function playBeep(frequency = 880, durationMs = 220): void {
  try {
    const AudioCtx = window.AudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    const now = ctx.currentTime;
    const end = now + durationMs / 1000;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(end + 0.02);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // Audio unavailable (rare) — silently ignore; sound is non-critical.
  }
}

/** Quick camera-shutter blip (high → low chirp). */
export function playShutter(): void {
  try {
    const ctx = new window.AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // Non-critical.
  }
}
