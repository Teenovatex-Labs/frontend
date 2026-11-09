# Install and notification prompts

Signed-in members get two custom prompts, each with its own Lottie: **install the app** and **turn on notifications**.
Code: `src/lib/prompts.ts` (rules, unit-tested), `src/components/app/PromptHost.tsx` (the card), `src/lib/installPrompt.ts` (shared install event).
Everything is per device, stored in `localStorage` under `tx_prompts:<userId>`. No backend, no paid service.

## When a prompt may appear

A prompt needs all of these at once:

| Rule | Value |
| --- | --- |
| Signed in, past setup | yes (it lives inside the app shell) |
| Visits (browser sessions) | install from the 2nd, notifications from the 3rd. Never on the first |
| A good moment | a completed action (success toast), a celebration (level up, result, pairing), or quiet dwell |
| Delay after the moment | 5 s after an action, 7 s after a celebration, 25 s of quiet on one page (dwell, visit 3+) |
| One per session | yes, either kind |
| Between any two prompts | 24 h |
| Quiet hours | none from 22:00 to 06:00 local |
| Not busy | not typing in a field, no open dialog, Alfred chat/consent/tour not active, tab visible |
| Form pages | never on messages, settings, welcome, membership review, new lab, lessons, search |
| Order | install first, then notifications |

## Caps and cooldowns

- **Not now / close / Escape**: pause 7 days, then 14, then 30. The third "Not now" retires that prompt.
- **Ignored** (nobody touched it for 30 s, it retracts; or the member started typing elsewhere): 3 day pause, no strike.
- **Don't ask again**: permanent for that prompt on that device. Settings → App & notifications still works.
- **Lifetime cap**: 6 appearances per prompt per device.
- Installed, subscribed, or browser permission blocked: never shown.

## Per platform

- **Android and desktop Chromium**: uses `beforeinstallprompt`; the card's Install button opens the browser's own dialog.
- **iOS (Safari and other iOS browsers)**: there is no install API, so the card opens a 3-step Add to Home Screen guide. We cannot tell whether they did it, so after "Got it" it waits 30 days; once the app runs standalone it is marked done.
- **Notifications on iOS**: web push only works for an installed app, so notifications are offered only once running standalone.
- **Notification pre-prompt**: our card explains the value first; the browser's native request fires only after "Turn on notifications". Closing the native box without choosing counts as "Not now", not a refusal, so we can ask again later. A real "Block" is respected permanently.
- Firefox and desktop Safari offer no install prompt, so only the Settings card covers them.

## Why these numbers

Browsers punish pages that ask too early or too often (Chrome quiets repeated notification asks), and a blocked permission cannot be re-asked. So we ask rarely, after the member has seen value, with our own card first. Tune the numbers in `RULES`; the tests pin the behaviour.

## Not covered

Application submission happens before an account exists (signup needs an accepted application), so no prompt can show then. The first signed-in visits after acceptance are where this starts.
