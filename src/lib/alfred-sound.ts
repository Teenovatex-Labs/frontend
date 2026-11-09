// Optional sound for the application. Off by default, never plays on its own, and uses tiny generated tones: no
// audio files to download, license or block a slow connection. Only plays after the applicant turns it on.

const KEY = "tx_alfred_sound";

export const soundPreference = (): boolean => {
  try {
    return window.localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
};

export const saveSoundPreference = (on: boolean) => {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // private mode: the choice just lasts for this visit
  }
};

export type Cue = "question" | "answer" | "reaction" | "done";

// Frequency pairs in Hz, a rising pair for good moments and a soft single for the rest.
const CUES: Record<Cue, number[]> = { question: [523], answer: [392, 523], reaction: [659], done: [523, 659, 784] };

let ctx: AudioContext | null = null;

/** Plays a cue if sound is on. Safe to call anywhere: it does nothing when sound is off or unavailable. */
export const playCue = (cue: Cue, on: boolean) => {
  if (!on || typeof window === "undefined") return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    void ctx.resume();
    const now = ctx.currentTime;
    CUES[cue].forEach((hz, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      const at = now + i * 0.09;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.06, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(at);
      osc.stop(at + 0.2);
    });
  } catch {
    // audio is a nicety; never let it break the application
  }
};
