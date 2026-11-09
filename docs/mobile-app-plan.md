# Mobile app plan (Android and iOS)

Status: planning only, nothing built. Written 2026-11-09.

## 1. Decision in one paragraph

Ship the existing web app as an installable PWA first (nothing to pay, a week or two of work), then wrap it as an Android app with a Trusted Web Activity once the one-off $25 Google Play fee is affordable or covered. Do **not** start a React Native codebase. Treat an iOS App Store app as blocked until either Apple waives the $99/year fee or someone funds it, and tell members on iPhone to use "Add to Home Screen", which is free and now supports push.

The assumption to challenge is "we need a native app". We do not know that yet. The thing we want is a home-screen icon, notifications and a faster return visit. A PWA gives all three on both platforms. What it does not give is store discoverability, and for an invite-only community whose members arrive through an application, discoverability is the weakest argument for a store listing.

## 2. What already exists (verified in the repos)

- `src/app/manifest.ts`: installable manifest, standalone display, start at `/home`, three shortcuts.
- `public/sw.js` and `src/lib/push.ts`: service worker plus Web Push (VAPID) subscribe and unsubscribe.
- `src/components/app/AppInstall.tsx`: a settings card for install and notifications.
- Backend `POST /push/subscribe`, `/push/unsubscribe`, `GET /push/key`, `pushSubscription` table, `web-push` library. Off unless `VAPID_*` env vars are set.
- Auth: short access token (15 min) held in memory, refresh token (7 days) in localStorage or sessionStorage, refresh rotation on the server (`backend/src/lib/tokens.ts`, `frontend/src/lib/api.ts`).
- Alfred: client-side command layer, optional server brain at `POST /pet/brain` (Gemini then Groq free tiers), sprite animations as frames in `public/alfred`.

So a large part of "the app" is already shipped. The plan is mostly packaging, not building.

## 3. Options compared

| | PWA only | PWA plus TWA (Bubblewrap) on Android | Capacitor wrapper | Expo / React Native |
|---|---|---|---|---|
| Reuses current Next.js code | 100% | 100% | about 90%, but see static export problem below | 0% for UI, shares API client only |
| Money to start | 0 | $25 once (Play) | $25 Android, $99/yr iOS | $25 Android, $99/yr iOS |
| iOS without Apple fee | Yes, via Add to Home Screen | Same | No | No (builds are free, shipping is not) |
| Native push on iOS | Web Push, home-screen install only | Same | APNs, needs paid account | APNs, needs paid account |
| Build effort (one developer) | 1 to 2 weeks | +3 to 5 days | 3 to 5 weeks | 3 to 5 months for parity |
| Ongoing upkeep | None extra | Near zero, tracks the website | Plugin and SDK upgrades, store review on every native change | Two codebases to keep in step, SDK upgrades twice a year |
| Store review risk | None | Low | Medium: Apple rejects thin web wrappers (guideline 4.2) | Low |
| Offline | Basic (offline page exists) | Same | Same, better with caching work | Best |

Honest notes on each:

- **PWA.** Cheapest and the only thing that costs nothing on both platforms. Weaknesses: on iOS the member must install it from Safari's share sheet and only then can they get push; there is no install prompt API on iOS, so our "install" popup has to teach the gesture. Android Chrome gives a real install prompt.
- **TWA (Bubblewrap or PWABuilder).** It is the same website inside a Chrome shell, so no second codebase. It needs the Play fee, a signing key we must back up (losing it strands the listing), and a `/.well-known/assetlinks.json` on each served host. Our app lives on several subdomains (`app.`, `admin.`, `tutors.`, `partners.`); the TWA should point only at `app.` and send other roles to the web.
- **Capacitor.** Tempting because it "wraps the web app", but ours is a Next.js app with server rendering and several hosts. Capacitor wants static files or a remote URL. Pointing it at the live URL works but is exactly what Apple tends to reject as a repackaged website, and it brings Apple's $99 anyway. Choose this only if we need native-only features such as background tasks or biometrics, which we do not today.
- **Expo / React Native.** Best end result, worst fit. It means rebuilding every screen (Labs, messages, applications, admin), re-implementing Alfred's sprite animation and the Lottie work, and keeping two UIs consistent, with a team that is effectively one person and a budget of about 2k naira a month. Revisit only if usage proves the PWA is the bottleneck.

## 4. Store fees and eligibility (these are real blockers)

**Google Play.** One-time registration fee of $25 (stated from general knowledge; I could not read the fee page in this session, so confirm it at sign-up). I found no nonprofit waiver for the fee. Account types: personal, or organisation which needs a D-U-N-S number (free to obtain, but slow). Things to verify before spending anything:

1. Whether a Nigerian card can pay a $25 USD charge. Many naira cards are blocked for international spend, so this may need a virtual dollar card or a friend abroad. The $25 is small; the card problem is the real blocker.
2. Whether Nigeria is a supported country for developer registration. I could not confirm this from the pages I read.
3. The testing rule for newly created personal accounts. As I understand it, new personal accounts must run a closed test with a set number of testers (reported as 12 testers for 14 days) before they can publish to production. I could not verify the current numbers; check at sign-up. An organisation account may avoid it. TeenovateX has an advantage here because it has a real member base to recruit testers from.

**Apple Developer Program.** $99 per year. There is a fee waiver, and I read Apple's page for it. Conditions, in short:

- Eligible: nonprofit organisations, accredited educational institutions, government entities.
- Must be a **legal entity** officially recognised as a nonprofit by the relevant authority in your region. **Individuals, sole proprietors and single-person businesses do not qualify.**
- Must not sell digital goods or services through the apps, and must not have signed the Paid Applications Agreement.
- Waiver must be reconfirmed each year; no refunds for fees already paid.
- The page gives no D-U-N-S requirement, no approval time and no country list.

The question this raises, which only Anas can answer: **is TeenovateX Labs a registered legal entity (for example a CAC-registered incorporated trustees body in Nigeria)?** If it is only a project run by an individual, the waiver is not available and the fee is a hard $99 a year, roughly the same as many months of Anas's whole budget. If it is registered, this is worth applying for, and the same registration gives a D-U-N-S number for Google's organisation account.

Do not assume the waiver will be granted. Apple's page says nothing about acceptance rates or timelines.

## 5. Free path, in order

1. **PWA on iOS and Android now.** Costs nothing. Requirements on iPhone: iOS 16.4 or later, installed to the Home Screen from Safari, permission requested from a user tap. Push does not work in a normal Safari tab. Expect some members on older iOS versions or on browsers other than Safari to miss out.
2. **Android TWA when $25 is available.** Anyone who wants to fund it, or a small donation, covers this. Do it from an organisation account if the entity exists.
3. **iOS App Store only if** the waiver is approved or a sponsor funds $99 a year. Until then, do not build for it.
4. Avoid "free" shortcuts that carry risk: sideloaded APKs trained into members, or third-party app-builder sites that charge monthly and take control of the listing.

## 6. Push notifications on free tiers

- **Web Push with our own VAPID keys (already coded).** Free, no vendor, works on Android Chrome, desktop, and iOS home-screen PWAs. This is the recommended base. Action needed: set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` on the backend, which turns it on.
- **FCM.** Free and unlimited for sending. Only useful if we ship a TWA or native Android app that needs native tokens. A TWA can keep using Web Push, so FCM can wait.
- **Expo push.** Free to send, but only helps if we adopt Expo, and on iOS it still needs the Apple account. No reason to take it unless we choose Expo.
- **OneSignal and similar.** Free tiers exist but add a third party that sees minors' device identifiers. Not worth it for a safeguarding-sensitive audience.

Design rules that apply to any channel: ask permission after a moment of value, not on first load; one permission ask per device, with a re-ask no sooner than 30 days after a "not now"; respect member quiet hours (default 21:00 to 07:00 local); stay within a per-day cap per member; do not send marketing to under-16s without the existing guardian consent flow. The in-app popup schedule is a separate piece of work.

## 7. Auth reuse

The same login works with no backend change for a PWA or TWA, because both run the website in a browser engine.

- A TWA shares Chrome's storage, so the member stays signed in the same way as on the web.
- The refresh token in localStorage is acceptable for a web context but is not what we would choose for a native app. A native app should use the OS secure store (Keychain or Keystore). If we ever go native, add a device-session type on the backend: a refresh token bound to a device record, revocable from Settings, with the 7-day rotation we already have.
- Tokens are per origin and each host has its own sign-in (documented in project memory), so a mobile app serves `app.` members only. Moderators and admins stay on `admin.` in a browser, which also reduces the risk of a lost phone exposing admin access.
- Google sign-in: a TWA works with the web flow. A native Google sign-in would need Android and iOS OAuth client IDs, which is another reason to stay web-based.
- Applicants are not users until accepted. Applications stay on the web; the app is for accepted members.

## 8. Alfred on mobile

- **Brain.** Unchanged: the same `POST /pet/brain` with its allowance and kill switch. The free-tier rate limits (Gemini and Groq) are shared across web and mobile, so expect the daily allowance to bite sooner if mobile use grows. Watch `PET_DAILY_LIMIT` and key cooldowns.
- **Presentation.** The desktop design is a draggable sprite in the corner, hover buttons and a chat box. Hover does not exist on touch. The mobile version should be a fixed corner chip that opens a bottom sheet; tap replaces hover, drag is optional, and the keyboard must not cover the input.
- **Cost.** The sprite is a 4 by 4 atlas per animation at 208 by 260. Test on a low-end Android phone for frame rate and memory, and keep the Lottie budget check (`scripts/check-lottie-budget.mjs`) in mind for popups.
- **Privacy.** Only the typed message, username and page go to the model, as today. On mobile, do not add device identifiers or location.

## 9. Phased roadmap

**Phase 0: decisions (no code).** Anas confirms whether TeenovateX is a legal entity, whether a Nigerian card can pay $25, and the budget he is willing to commit. Output: a go or no-go on Play and Apple.

**Phase 1: PWA hardening (about 1 to 2 weeks).** Turn on VAPID push; maskable and Apple touch icons; iOS install instructions screen (Share, Add to Home Screen); Android `beforeinstallprompt` flow; offline shell for the app routes; a push test endpoint for admins; measure install rate and push opt-in rate (privacy-friendly counters only). Cost: 0.

**Phase 2: install and notification prompts (about 1 week).** The popup designs with Lottie, triggered only after a member has had a useful session. Cost: 0.

**Phase 3: Android TWA (3 to 5 days, after fees).** Bubblewrap project, `assetlinks.json` for `app.`, signing key stored in two private places, closed test with members, then production. Cost: $25.

**Phase 4: decision gate (about 90 days after Phase 1).** Use real numbers: how many members installed the PWA, how many came back through it, how many iPhone members cannot get push. Only if the PWA is clearly limiting should Phase 5 be opened.

**Phase 5: iOS store app or Capacitor (only if gated in).** Needs the Apple account. Prefer a thin Capacitor shell with at least one real native feature so it passes review. Cost: $99 per year or a waiver.

**Not planned:** an Expo rewrite.

## 10. Risks and open questions

- Apple's waiver depends on a registered nonprofit entity; individuals cannot get it.
- The Play fee needs a payment method that works from Nigeria.
- Google's rules for new accounts (testing requirement, identity verification) change often; verify at sign-up rather than trusting this document.
- Minors' data: a store listing triggers each store's child-data disclosures (Play data safety form, Apple privacy labels) and the Play Families policy if the app targets under-13s. We refuse under-13s, but the declaration must match that.
- Push content must never contain private message text on a lock screen.
- iOS PWA push has limits: home-screen install only, and delivery can be less predictable than native. Do not promise members "instant" notifications on iPhone.
- Signing key loss on the Android TWA would strand the listing.
- Ongoing maintenance by one person: every extra codebase or store is a recurring cost in time, not just money.

## 11. Next actions for Anas

1. Say whether TeenovateX Labs is a registered organisation, and under what name.
2. Say whether a dollar-capable card is available for the $25 Play fee, or whether a sponsor should be asked.
3. Approve Phase 1, which is free, and set the VAPID environment variables on the backend.
