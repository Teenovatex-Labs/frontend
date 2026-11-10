/**
 * Shared motion settings. Every animated component should read from here so
 * the site feels consistent and one change retunes everything.
 */

export const ease = [0.22, 1, 0.36, 1] as const;

export const duration = {
  fast: 0.18,
  base: 0.32,
  slow: 0.6,
} as const;

/** Hard cap for any single Lottie file, in bytes. Enforced by scripts/check-lottie-budget.mjs. */
export const LOTTIE_MAX_BYTES = 30 * 1024;

/** True when the visitor asked for less motion or is saving data. */
export function prefersLowMotion({ allowSlowConnection = false }: { allowSlowConnection?: boolean } = {}): boolean {
  if (typeof window === "undefined") return true;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  const saveData = nav.connection?.saveData === true;
  const slow = nav.connection?.effectiveType === "2g" || nav.connection?.effectiveType === "slow-2g";
  return reduced || saveData || (!allowSlowConnection && slow);
}
