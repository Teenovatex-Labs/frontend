import type { AlfredState } from './alfred';

/** Studio dwell times let each complete-character animation read before the next. */
export const MOTION_DURATION: Record<AlfredState, number> = {
  operating: 2.4, planning: 5, thinking: 4.8, consent: 3.8, alerting: 2.8,
  resting: 5.6, waking: 3.4, failed: 4.2, celebrating: 3.2, done: 3.4,
  greeting: 3.2, reading: 6, curious: 4, playful: 3.6, offline: 5,
};
