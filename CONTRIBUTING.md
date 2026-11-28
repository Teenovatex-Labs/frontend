# Contributing

Several people build dashboards in parallel. These rules keep pull requests from colliding.

## The workflow

1. **Pick an issue** that is assigned to you and whose "Depends on" items are merged.
2. **Branch from the latest `main`**: `feat/...`, `fix/...` or `docs/...` (for example `feat/status-pill-11`).
3. **Stay in scope.** Only change the files the issue lists under "Files you may touch".
4. **Check locally**: `npm test`, `npm run build`, the bundle budget and `npm run typecheck`.
5. **Open a PR** using the template, with `Closes #<issue>` in the description.
6. **CI must be green** and a reviewer must approve. PRs are squash-merged.

Run `git config core.hooksPath scripts/githooks` once per clone to enable the local commit checks.

## Conflict-avoidance rules

- **One issue = one domain folder.** New screens, services and components go in new files inside their own folder.
- **Shared files take registry additions only.** These files are edited by everyone, so you may only add an entry (a nav item, a host row, an export) and only when the issue allows it:
  `src/components/admin/AdminShell.tsx`, `src/components/app/nav.ts`, `src/components/app/Sidebar.tsx`, `src/middleware.ts`, `src/lib/hosts.ts`, `src/lib/services.ts`, `src/lib/labs.ts` (`keys`), `src/app/globals.css`, `tailwind.config.ts`, `scripts/check-budget.mjs`, `package.json` and the lockfile.
  CODEOWNERS requests a review from the owner whenever one of them changes.
- **Contract first.** A screen consumes the API documented in the backend's `docs/api/<domain>.md`. If the endpoint is not merged yet, mock it behind the same shape and say so in the PR.
- **Keep PRs small.** Aim for size S or M (roughly under 400 changed lines). Split anything bigger into separate issues.
- **No new dependencies** unless the issue says so.

## Performance budget

CI fails the PR if a route's first-load JavaScript goes over its limit (215 kB by default). Load heavy libraries (charts, editors, 3D, big animations) with `next/dynamic` or `import()` so they stay out of the first load. A new surface that genuinely needs more sets its own limit with one entry in the budget config, agreed in its issue.

## Design

Use the tokens and components in `src/components/ui/*` and follow `docs/design-system.md`. No hard-coded hex colors.

## Safeguarding

Most members are minors. On anything labelled `safeguarding`, follow the backend safeguarding spec, never show a minor's personal details to tutors or partners beyond what the spec allows, and tick the safeguarding box in the PR template.

## Commits and PRs

- Write commit messages as `type: short summary (#issue)`, for example `feat: StatusPill primitive (#11)`.
- Commit under your own name. Do not add AI-tool attribution (co-author lines, session links, "generated with" footers) to commits, PR titles or PR bodies. The `No AI attribution` CI check fails the PR if you do.
