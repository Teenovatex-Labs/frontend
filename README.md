# TeenovateX frontend

Next.js and React application for the TeenovateX website, member app, and staff and partner surfaces. Production deploys from `main` to the Vercel project `teenovatex`.

## Live infrastructure

The frontend's production API base URL is `https://api.teenovatex.org/api/v1`. The API and PostgreSQL 18 run on the Oracle A1 VPS; Neon Storage holds offsite database dumps. See [infrastructure and recovery](docs/INFRASTRUCTURE.md) for DNS, server, backups, restore, and ownership. Keep secrets and SSH keys outside Git.

## Development

Copy `.env.example` to a local environment file and set `NEXT_PUBLIC_API_URL` for the desired backend. Run `npm ci` and `npm run dev`. Before shipping, use `npm test`, `npm run typecheck`, and `npm run build`.

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
