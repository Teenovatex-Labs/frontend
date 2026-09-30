# Alfred

Human TeenovateX companion: black curls, warm brown complexion, charcoal three-piece suit, rose eyes and gold accents. Preview at `/alfred`; the floating companion is mounted inside the authenticated AppShell.

## Artwork and playback

The replacement uses complete illustrated frames, generated with the built-in image generator from the approved concept. No independently rotated body parts remain. Fourteen original 16-frame sequences support fifteen states: greeting, waking, resting, planning, thinking, reading, curious, operating, consent, alerting, playful, celebrating, done, failed and offline. Consent deliberately shares the patient waiting artwork with offline; attempts to generate a separate permission pose were blocked by the image service.

Source sheets live in `public/alfred/source/`; available generation prompts are in `docs/alfred-prompts/`. The approved concept is `public/alfred/concept.png`. Each production WebP atlas contains a 4 × 4 grid of 256 × 320 transparent frames. One common scale per sequence preserves proportions. Playback uses elapsed time at 8–20 authored frames per second; waking, failed and done hold their final frame. This is illustrated frame animation, not interpolated 60-fps motion capture.

Atlases load on demand and are cached. Pause retains the playhead. Reduced motion shows a still pose. Offscreen and hidden-tab playback stops. Image loading failures display the original concept.

## Integration

`useAlfred()` exposes `beginTask(message, state)`, `requestConsent({title, message})`, `notify(message, kind)`, `wake`, `play`, and visibility preferences. Task handles provide `update(message, state)`, `done(message)`, `fail(message)`, and `cancel()`. Cancellation never claims success. Permission resolves only from an explicit choice; session cleanup resolves pending permission as declined.

The existing API wrapper drives real request activity and errors, including refresh retries. Authenticated notification polling announces new notifications after an initial baseline, pauses while the page is hidden, and resets on account changes. Planning and thinking are available for feature-specific workflows; the studio demonstrates them using a clearly labeled simulation. No backend API or AI task execution was added.

The floating companion supports pointer dragging, keyboard arrow movement, remembered position, hide/minimize/restore, inactivity/rest/wake, and explicit permission controls. State priority protects pending consent, active work, and failure feedback from playful/idle interruptions.

## Rebuild and verify

```sh
node scripts/package-alfred-frames.mjs
node scripts/export-alfred-previews.mjs
node --experimental-strip-types --test tests/alfred.test.mjs
npm run build
```

Packing checks all frames, dimensions and transparency. Previews are exported GIFs and a labeled contact sheet. Controller tests cover concurrency, cancellation, consent, offline recovery, session cleanup, inactivity and failure queues. The studio is public and marked noindex. Authenticated production flows require a real signed-in session for end-to-end verification.
