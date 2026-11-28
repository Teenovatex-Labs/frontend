# TeenovateX frontend

Next.js and React application for the TeenovateX website, member app, and staff and partner surfaces. Production deploys from `main` to the Vercel project `teenovatex`.

## Live infrastructure

The frontend's production API base URL is `https://api.teenovatex.org/api/v1`. The API and PostgreSQL 18 run on the Oracle A1 VPS; Neon Storage holds offsite database dumps. See [infrastructure and recovery](docs/INFRASTRUCTURE.md) for DNS, server, backups, restore, and ownership. Keep secrets and SSH keys outside Git.

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3 and TanStack Query. Motion uses framer-motion, GSAP and Lottie. Tests are plain `node --test` files in `tests/`.

## Hosts

One Next.js project serves every audience. Each audience gets its own subdomain and its own sign-in, because tokens are stored per origin. The table lives in `src/lib/hosts.ts`; adding a surface means adding one row there.

| Host | Who | Route folder | Status |
| --- | --- | --- | --- |
| `teenovatex.org` | Public landing, apply, consent | `/` | live |
| `app.teenovatex.org` | Members and mentors | `/` | live |
| `admin.teenovatex.org` | Moderators and admins | `/admin` | live |
| `tutors.teenovatex.org` | Tutors | `/tutor` | planned |
| `partners.teenovatex.org` | Partners | `/partner` | planned |

Localhost and Vercel previews do not match a host, so everything is served from one origin by path (open `/admin` directly).

## Development

1. `cp .env.example .env.local` and fill in the values below.
2. `npm ci`
3. `npm run dev` and open http://localhost:3000

| Variable | Required | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | Backend base URL. Local backend: `http://localhost:4000/api/v1`. Production: `https://api.teenovatex.org/api/v1`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | for Google sign-in | Same value as the backend `GOOGLE_CLIENT_ID`. |
| `NEXT_PUBLIC_SENTRY_DSN` | no | Browser error alerts. |
| `NEXT_PUBLIC_APP_ORIGIN`, `NEXT_PUBLIC_SITE_ORIGIN` | production only | Absolute origins for cross-host links. Leave empty locally. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm test` | Unit tests (`tests/*.test.mjs`) |
| `npm run typecheck` | TypeScript check (run after a build so route types exist) |
| `npm run build` | Production build |
| `node scripts/check-budget.mjs build.log` | Bundle budget: fails if a route's first-load JS is over its limit |
| `npm run check:lottie` | Lottie file size budget |

CI runs tests, build, the bundle budget and typecheck on every PR, plus the `No AI attribution` check. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

## Design system

Tokens, fonts and component rules live in `docs/design-system.md` (being written in issue #15). Reuse `src/components/ui/*` and do not hard-code hex colors.

## Design system: buttons

Every button shares one shape and one hover (lift 3px with a pink hard shadow). There are two weights:

| Class | Use it for |
| --- | --- |
| `.btn` (primary) | The one action a screen wants you to take: Sign up, Become a Teenovator, Send it, Give. Ink fill, cream text. |
| `.btn-secondary` | Every other action that still deserves a button: Log in, See what happens here, Back, Not now, Send another. Yellow fill with an ink outline; goes see-through on hover and press. |

Modifiers (work on both):

- `.btn-sm` for compact spots such as the header, prompts and inline calls to action.
- `.btn-icon` for a square, icon-only button (the auth Back buttons).
- `.on-dark` / `.on-yellow` on `.btn-secondary` when it sits on the ink band (Donate) or the yellow band (Join), where the default yellow would disappear.

Use at most one primary per view. Text links inside sentences stay plain underlined links, and toggles or filters (chips, the donation amounts) are not buttons.
