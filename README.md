# Phases

**Pour coder l'app : ouvre `IMPLEMENTATION.md`.** Specs : `SPEC.md`. Écrans : `design/`. Règles Cursor : `.cursor/rules/phases.mdc`.

Free, local-only iPhone app that follows a partner's (or your own) cycle and sends a heads-up the day before PMS and the period. FR / EN.

```
apps/web      Static site for Vercel: landing FR (/) + EN (/en), sync relay (/s), privacy pages
apps/mobile   Expo app (to scaffold, IMPLEMENTATION.md step 1). Already has assets/, src/i18n, src/content, store/
design        18 screens as PNG + HTML (visual reference)
tests         Node tests for the sync format + cycle engine
```

No backend anywhere. The site has no build step, no cookies, no analytics, no third-party requests (enforced by the CSP in `apps/web/vercel.json`: `connect-src 'none'`).

## Deploy the site (Vercel)

1. Push this repo to GitHub.
2. Vercel → Add New Project → import the repo → **Root Directory: `apps/web`** → Framework preset: **Other** → no build command, no output directory.
3. Add the domain (`tryphases.io` or whatever you buy) in Project → Domains.
4. If the domain isn't `tryphases.io`, change `SITE` in `apps/web/assets/sync.js` and the canonical/hreflang URLs in the HTML files (search for `tryphases.io`).

Before launch, replace the placeholders: `[LIEN TESTFLIGHT]` / `[TESTFLIGHT LINK]`, `[ADRESSE E-MAIL DE CONTACT]` / `[CONTACT EMAIL]`. Icons, splash, OG images and App Store screenshots are generated from the SVGs in `apps/mobile/assets/brand/` (logo: P + half moon): `npm i -D playwright @fontsource/nunito && node tools/generate-assets.mjs`. Store listing and checklist: `apps/mobile/store/README.md`.

## Sync between two phones

No account, no server. The whole state is a few hundred bytes:

```
https://tryphases.io/s#1.<base64url({"c":["2026-08-07","2026-09-04"],"L":28,"P":5})>
```

- The payload is after `#`: browsers never send the fragment to a server, so Vercel never sees it.
- The QR code encodes the same URL. One decoder: `apps/web/assets/sync.js` (`encode`, `decode`, `status`). Port it to TypeScript in the app or import it as-is.
- `/s` decodes in the browser, shows the cycle status, and offers **Open in Phases** (`phases://s#1.…`).
- **Universal Links** (link opens the app directly): needs the paid Apple Developer Program. Then replace `TEAMID` in `apps/web/.well-known/apple-app-site-association` and add `applinks:tryphases.io` to the app's associated domains. Without it, the custom scheme button works.

Merge rule on receive: union of start dates; two dates < 5 days apart = same cycle; nothing overwritten without confirmation.

```
node tests/sync.test.mjs
```

## Mobile app (Expo)

```
cd apps/mobile
npx create-expo-app@latest . --template default
npx expo install expo-notifications expo-sqlite expo-localization expo-local-authentication expo-haptics expo-sharing expo-document-picker expo-camera react-native-svg react-native-reanimated
npm i zustand date-fns i18next react-i18next
```

- `app.json`: `"scheme": "phases"`, `"ios": { "bundleIdentifier": "io.tryphases.app" }`.
- i18n: `src/i18n/fr.json` + `en.json`, language from `expo-localization` (FR if the phone is in French, else EN), override in Settings.
- Dev: Expo Go on the iPhone (local notifications work there). Install as a real app: `npx expo run:ios --device` (free Apple ID, re-sign every 7 days) or EAS Build + TestFlight (Apple Developer Program).

Full product spec, reminders logic and screen list: see the Phases spec doc.
