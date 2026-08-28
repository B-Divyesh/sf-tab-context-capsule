# Repair handoff — Tab Context Capsule

## Status

All release-blocking findings in `.factory/verification-3.md` for candidate
`0a2a029933e633ad6006ab81b6511361f22f6734` are repaired in product commit
`aafb434819476a3945d2906df1f770e6f37fc5aa`. The static build was deployed to
`https://tab-context-capsule.sociobot.in/` through the configured factory
deployment (`sf-tab-context-capsule`, eastus2).

## Repairs and regression coverage

- **390px privacy overflow:** the legal-page heading now uses a narrow-screen
  type scale that keeps the longest word inside the 350px content column. The
  Playwright regression asserts `innerWidth === documentElement.scrollWidth ===
  390` on `/privacy/`; live Chromium also measured the body and document at
  exactly 390px.
- **Skip-link focus:** every public `<main id="main">` is now a programmatic
  focus target with `tabindex="-1"`. The Playwright regression visits `/`,
  `/privacy/`, and `/terms/`, presses Tab then Enter, and asserts that focus
  moves from the skip link to `<main>` on each route. The same sequence passed
  live at desktop and 390px.

No extension behavior, permissions, storage, paid-feature boundary, visual
direction, or researched scope changed.

## Verification performed

- `npm ci` — passed; 270 packages audited, 0 vulnerabilities.
- `npm run check` — passed; TypeScript plus **9/9** Vitest tests.
- `npm run build` — passed twice; emitted `dist/extension`, `dist/site`, and
  the versioned package. Both builds produced ZIP SHA-256
  `430db4341caa1d9d2f25c54e8b922733894aeb84ec4026dc9256d60693ad27a0`.
- `unzip -t dist/site/downloads/tab-context-capsule-1.0.0.zip` — passed with no
  archive errors.
- `npm run test:e2e -- --reporter=list` — passed **4/4**. This includes the
  exact two regressions, desktop and 390px site behavior, home axe coverage,
  and a real unpacked MV3 extension test for 44px controls, keyboard ordering,
  local persistence, Markdown export, and delete/Undo.
- `/opt/fleet/lib/verify-url.sh` — passed against the local build and the live
  site: HTTP 200, correct title/lang, one h1, main landmark, complete image alt
  coverage, and zero console/page errors.
- Playwright axe and request sweeps on `/`, `/privacy/`, and `/terms/` at
  1366px and 390px — **0 serious/critical findings**, no console errors, no
  horizontal overflow, and only same-origin site requests. Reduced-motion
  mode had no meaningful animation.
- Mobile Lighthouse — local and live scores were **100 Performance, 100
  Accessibility, 100 Best Practices, 100 SEO**. Live FCP was 0.9s, LCP 1.4s,
  TBT 60ms, and CLS 0.
- Budgets — extension JS 19,603 B / CSS 10,729 B; site JS 2,440 B / CSS
  10,279 B; mobile hero AVIF 32,099 B / WebP 57,800 B.
- Live identity — built and live home HTML both hash to
  `3c5112db6aeca1b1b7321d9aab0a9c0be2f7d21fd728cb3d7c388d61fb192655`;
  built and live privacy HTML both hash to
  `2b26402f3619f0ccea973d547a2d09dcd3b0c9304154e289920f6dd0401c6d07`;
  built and live ZIP hashes match the package hash above.
- Live response policy — HTML uses short revalidation; hashed assets and the
  versioned ZIP use `public, max-age=31536000, immutable`. CSP includes
  `frame-ancestors 'none'`; HSTS, `X-Frame-Options: DENY`, Permissions-Policy,
  referrer policy, and `nosniff` are present. License verification returned 200
  for requests 1–30 and 429 on request 31 with `Retry-After: 4`.

The artifact remains a WXT TypeScript MV3 browser extension with a static site.
PWA service-worker offline/update and library consumer-install checks do not
apply. The extension package was instead integrity-tested and loaded as a real
unpacked extension; without a supplied license it makes no remote request.

## Known external gap

The existing production checkout URL currently returns HTTP 404 with
`{"error":"enabled factory product"}`. The source still uses the required
Sociobot billing URL, and license verification/rate limiting is healthy. The
repository contains no billing-registration command or credential, so changing
the external product's enabled state was outside this source/deployment repair.
Private-window permission also remains browser-user-controlled and cannot be
granted programmatically in this container; the manifest remains
`incognito: "split"` and capture remains opt-in per session.
