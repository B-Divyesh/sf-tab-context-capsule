# Verification 5 handoff — Tab Context Capsule

## Status

**PASS.** Independent verification 5 found **0 findings** and **0 untested
claims**. The current deployed product remains
https://tab-context-capsule.sociobot.in/.

- Implementation reviewed: `59d506adabf8ff16fa115ee0e5bf7a188a25b142`
- Documentation/report HEAD: `926d08c6a50c8be6d5eb7e5238d83d5e9fae6168`
- Full evidence: `.factory/verification-5.md`

Fresh verification ran `npm ci`, `npm run check` (8/8), `npm run build`, ZIP
integrity validation, the full 18/18 browser suite, and every one of the 11
declared claim commands separately. Fresh desktop and 390px live sessions
verified the first-screen job/audience/action, populated demo, persistent demo
label, reset, exit, real-data isolation, accessibility, routes, privacy, and
the designed HTTP 404. Fresh mobile Lighthouse scored 100/100/100/100.

The live home, demo, privacy, terms, and extension ZIP match the rebuilt
implementation byte-for-byte. The extension was also loaded as an unpacked
artifact in a clean temporary profile; normal capture plus empty-selection,
malformed/oversize JSON, valid-import recovery, delete, and Undo all passed.

The only remaining item is external: Conductor checkout registration still
returns the billing service's HTTP 404. It is outside this repository and is
recorded as a non-finding dependency in verification 5.

- Implementation and deployed product SHA:
  `59d506adabf8ff16fa115ee0e5bf7a188a25b142`
- Documentation evidence SHA:
  `0fcfa4d5e0f7fca4708e36d6fc6376078f7b2f16`. The later bookkeeping commit
  only inserts this identifier.
- Deployment: existing `sf-tab-context-capsule` Azure Static Web App in
  `eastus2`; one static production deployment, no backend or mutable volume.
- Deployed extension ZIP SHA-256:
  `6aad32a59e98d1333c501c6f9460e6662172a7600f0b142ca0d81bddf0183244`

## Repairs

### One-click isolated demo

The first screen now leads with **Try it with sample data**. `/demo/` opens a
populated capsule workbench with realistic coastal-research output and urban
heat sample tabs. It supports capture, notes, order, private-sample opt-in,
close confirmation, reopen, Markdown/JSON export, JSON import, delete, reset,
and **Start for real**.

The banner remains visible while scrolling and says **Demo — sample data,
nothing is saved**. Demo persistence is limited to
`demo:tab-context-capsule:capsules:v1`. The isolation test seeds a non-demo
sentinel, changes and exits the demo, and proves the sentinel is unchanged.
The same reset/exit behavior passed cold on the live phone route. See
`.factory/demo.md`.

### Declared, outcome-tested claims

`.factory/claims.json` declares the 11 public claims identified by independent
verification. Each has exactly one `@claim:<id>` Playwright test and its own
command. All 11 commands passed separately after the documented clean setup.

The tagged tests exercise the real unpacked extension for capture, confirmed
closing, Markdown, JSON round-trip, request privacy, no-account operation, the
free core, and daily token verification. The demo-specific tests exercise
namespace isolation and per-capture private-sample behavior. Tests inspect
downloads, extension storage, tab state, network requests, and restored data;
they do not assert implementation strings.

### Real 404, first-screen copy, and site structure

The SPA fallback was removed. The deployment config now rewrites host 404s to a
designed `404.html` while preserving HTTP 404. Live
`/does-not-exist-59d506a` returns 404 with the page title
**Page not found — Tab Context Capsule**, a clear explanation, and home/demo
actions.

The first screen now says **Save selected tabs with their purpose**, names
researchers and knowledge workers, and shows the sample action plus its result
before scrolling at 390×844 and desktop sizes. Metaphor headings were replaced
with task names in the public site and extension. The copy audit and terminology
table are in `.factory/copy-audit.md`.

Every public route has a route-specific title, description, canonical link,
Open Graph and Twitter metadata, SVG favicon, 180px touch icon, one h1, main
landmark, standard header, and footer build identifier. The original poster now
also produces a 1200×630 social card. The sitemap includes the demo.

## Verification

Clean setup and repository gates:

- `npm ci` — passed; 270 packages audited, 0 vulnerabilities.
- `npm run check` — passed; TypeScript and 8/8 Vitest tests.
- `npm run build` — passed; emitted `dist/extension`, `dist/site`, the
  demo, 404 document, metadata assets, and both ZIP URLs.
- A second build produced the same versioned ZIP SHA-256 shown above.
- `unzip -t dist/site/downloads/tab-context-capsule-1.0.0.zip` — passed.
- `npm run test:e2e -- --reporter=list` — 18/18 passed.
- Every one of the 11 commands in `.factory/claims.json` passed separately.

Browser, accessibility, privacy, and performance:

- The factory `verify-url.sh` passed locally and live: HTTP 200, title,
  `lang=en`, one h1, main, complete image alt coverage, and zero normal-route
  console errors.
- Playwright axe found 0 serious/critical issues on home, demo, privacy, terms,
  and the unpacked popup. Fresh live privacy checks passed at desktop and
  390px.
- Skip-link focus passed on home, demo, privacy, terms, and 404. The 390px
  routes have no horizontal overflow. Demo and extension controls retain the
  44px touch target baseline. Reduced motion disables smooth scrolling and
  shortens motion.
- Fresh live phone and desktop contexts saw the correct job, audience, and
  sample action before scrolling. Demo seed, change, reset, sticky label, and
  real-data sentinel checks passed in both.
- Normal live flows requested only the product origin. The deliberate 404
  navigation produces the browser's expected failed-resource console message;
  the page itself is complete and is correctly classified as a 404.
- Live Lighthouse mobile reported 100 Performance, 100 Accessibility, 100 Best
  Practices, and 100 SEO; FCP 0.9s, LCP 1.4s, TBT 0ms, CLS 0. Lighthouse then
  emitted its known `TARGET_CRASHED` warning while collecting the
  `FullPageScreenshot` artifact, after the scores and timings were written.
- Site JS is 12.59 KB uncompressed across the shared/demo/home chunks; site CSS
  is 16.33 KB; extension JS is 20.16 KB and CSS is 10.73 KB. The mobile hero is
  32.10 KB AVIF / 57.80 KB WebP.
- Built and live home, demo, privacy, terms, 404, and ZIP hashes matched exactly.
  Hashed assets and the versioned ZIP return one-year immutable caching.
  CSP/frame protection, HSTS, Permissions-Policy, referrer policy, and
  `nosniff` are live.

## Earlier findings

| Finding | Current disposition |
| --- | --- |
| 40px popup order controls | Fixed earlier; live candidate retains 48×48px controls and browser measurement passes. |
| Missing immutable caching | Fixed earlier; confirmed live on hashed assets and versioned ZIP. |
| Missing CSP/frame/permissions headers | Fixed earlier; confirmed live. |
| 390px privacy overflow | Fixed earlier; still measures 390px content at a 390px viewport. |
| Skip link did not focus main | Fixed earlier; expanded regression now covers every public route including demo and 404. |
| No one-click demo | Fixed and verified live with reset, exit, persistent label, and namespace isolation. |
| No claims registry/tests | Fixed; 11/11 declared commands pass separately. |
| Unknown routes returned home/200 | Fixed; live unknown route returns designed HTTP 404. |
| First screen did not state job/audience/action | Fixed and checked cold on phone and desktop. |
| Metadata/header incomplete | Fixed across every route. |

## Known external dependency

The public Conductor offer remains $12 USD as a one-time purchase and the paid
features remain intact. The production checkout endpoint still returns HTTP 404
with the billing service's enabled-product error. Billing registration belongs
to the separate operator and was not changed. License verification is live and
returns a structured invalid verdict for an invalid token; the tagged test
verifies the extension's successful fixture path and daily request cache.

Public registration metadata is in
`/work/.evidence/billing-offer.json`. Browser-store signing/publication is
also outside this repository. Private-window extension permission remains a
browser-user-controlled setting; the manifest stays `incognito: "split"`, and
the per-capture choice is never persisted.

This is a static site plus a local MV3 extension. Product-backend health,
tenancy, server rate limits, SQLite restart persistence, PWA service-worker
updates, and library/CLI consumer installation do not apply.
