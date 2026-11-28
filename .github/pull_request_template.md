Closes #

## What changed
<!-- A few bullets. What a reviewer should look at first. -->

## How I tested it
<!-- Commands you ran, screens you checked, screenshots for UI changes. -->

## Checklist
- [ ] Only touched the files the issue allows (shared files: registry additions only)
- [ ] `npm test`, `npm run build` and `npm run typecheck` pass locally
- [ ] Bundle budget: route first-load JS is under its limit; heavy libraries are dynamically imported
- [ ] UI uses design tokens and `src/components/ui/*` (no hard-coded hex); loading, empty and error states covered
- [ ] Safeguarding: N/A, or I followed the safeguarding spec (no minor's personal data exposed beyond what it allows)
- [ ] If an API was mocked, the PR says which endpoint and shape
