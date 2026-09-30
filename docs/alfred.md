# Alfred

Alfred is the small companion who lives in the corner of the app. He is **still** unless something
specific is happening, and he does things for you only when you say so.

## When he moves

From strongest to weakest (`src/lib/alfred.ts`):

1. He is asking your permission.
2. He is working on something (a save or upload that takes longer than about 0.7 seconds).
3. He has an update for you (a new notification).
4. A one-off reaction is playing: greeting you, finishing a job, hitting a snag.
5. You are dragging him.
6. You are hovering over him, or did in the last 3 seconds.

Otherwise he stands in one still pose and nothing on screen changes (no animation frames run at
all). Background reads and quick requests never make him move. With reduced motion on, he never
animates.

## What you see

- Hover: two small buttons appear under him, **Yo** and **minimize**.
- **Yo**: he greets you and a chat box opens under him (or above, when he is low on the screen).
- Minimized: a small round chip in the corner; the **+** on it brings him back.
- Drag him anywhere; the spot is remembered. Arrow keys move him too (Shift for bigger steps).

## What you can ask (`src/lib/alfred-intents.ts`, `alfred-commands.ts`)

Reads are free: "my points", "my streak", "what's new", "upcoming events", "trending labs".
Navigation: "open labs", "go to my profile", "start a lab".
Anything that changes something asks first (Allow / Not now; **Always allow** only for low-risk,
self-only actions such as marking notifications read): "mark all notifications read",
"follow @name", "vote for <lab>", "sign out".

This runs with no AI. A model can later sit in front of `interpret()` and return the same intents.

## Art

Frames are separately painted poses, so they drift a few pixels from frame to frame. The
`scripts/stabilize-alfred.py` script pins the feet to the same spot, deletes stray fragments that
looked like his head breaking off, and rebuilds the sheets at display size:

    python3 scripts/stabilize-alfred.py

Input `public/alfred/sprites-source/*.webp`, output `public/alfred/v3/*.webp` (4 x 4 atlases of
208 x 260 frames). `public/alfred/animations.json` describes each animation (fps, loop or one-shot,
frame blending). The 20MB of original sheets in `public/alfred/source/` are not in git.
