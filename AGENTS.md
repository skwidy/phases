# Agents

Coding agents working on this repo: read `.cursor/rules/phases.mdc` (hard rules), then `SPEC.md` (what to build), then `IMPLEMENTATION.md` (in which order). Visual references are in `design/screens/`.

- `apps/web` — static site for Vercel. No build step. Do not add a framework.
- `apps/mobile` — Expo app. Already contains `assets/`, `src/i18n/`, `src/content/` and `store/`; scaffold around them, never overwrite them.
- `tests/` — reference tests for the sync format and cycle engine (`npm test` at the root).
- `tools/generate-assets.mjs` — regenerates icons, splash, OG images and App Store screenshots.
