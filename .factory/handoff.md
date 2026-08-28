# Handoff — Tab Context Capsule v1

## What was built

- A WXT + TypeScript MV3 extension with only `tabs` and `storage` permissions.
- Current-window tab capture with selected-tab ordering, per-page notes, a
  capsule name, next step, pinned-tab safety, explicit private-tab opt-in, and
  exact-count confirmation before originals are closed.
- Local capsule library with reopen, Markdown export, single/all JSON export,
  validated JSON import, confirmed delete, and timed Undo.
- Offline-first behavior: all capsule work is local and works without a
  network. License verification failure leaves the free product usable and
  explains how to retry.
- $12 one-time Conductor unlock using the Sociobot billing contract: production
  checkout link, query-token capture, local token/cache keys, at-most-daily
  verification, offline cached verdict, invalid-license relock, and paste-to-
  restore. It adds convenience only (one-click Markdown copy and color tickets).
- Responsive static product site plus `/privacy/`, `/terms/`, robots, sitemap,
  and a downloadable packaged extension at
  `/downloads/tab-context-capsule.zip`.
- A product-specific art-deco transit system and original generated poster.
  Prompt, review, provenance, tokens, spacing, responsive intent, and motion are
  recorded in `.factory/design.md`.

## Verification completed

- `npm run check`: TypeScript passes; 7/7 Vitest tests pass.
- `npm run build`: passes from the locked dependency tree and produces
  `dist/extension/`, `dist/site/index.html`, and the packaged ZIP.
- `npm run test:e2e`: 2/2 Playwright tests pass at desktop and 390 px; axe finds
  no serious or critical issues; no browser console errors.
- `/opt/fleet/lib/verify-url.sh`: HTTP 200, title/lang/main present, one H1,
  zero missing image alts, zero unlabeled buttons, and zero console errors.
- Real Chromium MV3 smoke test: loaded `dist/extension` unpacked, captured two
  live web tabs, added a next step and note, saved the capsule, saw it in the
  library, and downloaded `evidence-run.md`; no console/page errors.
- Bundle sizes: extension total 38.70 KB (19.70 KB JS, 10.73 KB CSS); site JS
  2.44 KB and CSS 10.23 KB. Largest hero variant is 164 KB WebP / 92 KB AVIF;
  mobile variants are 60 KB WebP / 36 KB AVIF.
- Lighthouse 12.8.2 mobile against the final production preview: Performance
  100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.6 s, FCP 0.9 s,
  TBT 0 ms, CLS 0.
- `npm audit`: 0 vulnerabilities.

## Run and deploy

```sh
npm ci
npm run check
npm run build
npm run test:e2e
```

Deploy `dist/site/` as the static root. Submit/sign the contents of
`dist/extension/` through the browser extension store workflow outside this
repository.

## Known gaps / factory next steps

- Register `tab-context-capsule` with the Sociobot billing engine and set the
  production return URL to `https://tab-context-capsule.sociobot.in/`. The code
  intentionally contains no provider product ID or secret.
- Browser-store signing and listing publication are factory deployment tasks;
  the repository supplies a tested unsigned ZIP.
- Cross-device sync is intentionally absent. JSON export/import is the portable
  handoff and backup mechanism promised by the brief.
