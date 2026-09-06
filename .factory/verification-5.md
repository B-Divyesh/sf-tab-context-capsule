# Save selected browser tabs with context — PASS

**Implementation reviewed:** `59d506adabf8ff16fa115ee0e5bf7a188a25b142`  
**Documentation branch HEAD:** `926d08c6a50c8be6d5eb7e5238d83d5e9fae6168`  
**Live URL:** https://tab-context-capsule.sociobot.in/  
**Verified:** 2026-09-06 UTC  
**Verdict:** **PASS** — **0 findings** and **0 untested public claims**.

The job is clear before scrolling: save selected browser tabs with their purpose.
It is for researchers and knowledge workers who need to close a project and
resume it later. The first action is **Try it with sample data**; it opens an
isolated, populated research capsule.

## Clean checkout and build

`npm ci` completed with 0 audit vulnerabilities. No product source was changed
during verification.

| Check | Result |
| --- | --- |
| `npm run check` | Passed: TypeScript plus 8/8 Vitest tests. |
| `npm run build` | Passed: extension, deterministic ZIP, and static site emitted. |
| `unzip -t dist/site/downloads/tab-context-capsule-1.0.0.zip` | Passed. |
| `npm run test:e2e -- --reporter=list` | Passed: 18/18 browser tests. |
| Fresh mobile Lighthouse | 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; FCP 0.9 s, LCP 1.2 s, TBT 10 ms, CLS 0. |
| Built/live identity | Home, demo, privacy, terms, and versioned ZIP SHA-256 values matched byte-for-byte. ZIP: `6aad32a59e98d1333c501c6f9460e6662172a7600f0b142ca0d81bddf0183244`. |

The factory URL verifier passed live on the home page: HTTP 200, route title,
`lang=en`, one h1, main landmark, complete image alt coverage, no unlabeled
buttons, and no console or page errors.

## Public claims

Every command declared in `.factory/claims.json` was run separately after the
clean setup. Each selected exactly one tagged browser test and passed.

| Claim | Result |
| --- | --- |
| `capture-context` | Passed — saves name, notes, order, and next step. |
| `close-by-choice` | Passed — originals remain until checked and confirmed. |
| `markdown-export` | Passed — downloaded Markdown is readable and complete. |
| `json-roundtrip` | Passed — JSON restores the same capsule. |
| `local-storage` | Passed — demo and real-data namespaces stay separate. |
| `no-url-transmission` | Passed — capture sends no capsule data to another origin. |
| `no-account-analytics` | Passed — no sign-in, analytics, host permissions, or content scripts. |
| `private-opt-in` | Passed — private sample is excluded by default and resets after capture. |
| `free-core` | Passed — capture, reopen, import, and exports work without a license. |
| `conductor-offer` | Passed — public offer states $12 once and its two paid conveniences. |
| `license-check` | Passed — sends only the token and caches automatic verification for a day. |

There are no additional visitor-facing promises in the live landing page, legal
pages, or README without a matching declared claim.

## Fresh live browser checks

Fresh desktop and 390x844 phone contexts loaded only the product origin during
the landing and demo flows. Both showed the job, audience, and sample action
before scrolling. The one-click sample opened a realistic saved coastal research
capsule, with ordered links, page notes, and a next step.

The visible **Demo — sample data, nothing is saved** label remained available
while using the workbench. A live isolation check seeded an unrelated
`capsules:v1` sentinel, saved a temporary demo capsule, reset it, and selected
**Start for real**. The real sentinel stayed unchanged throughout; reset
restored the bundled sample; Start for real removed only
`demo:tab-context-capsule:capsules:v1`.

The built MV3 extension was loaded unpacked in a new temporary browser profile.
It captured regular tabs into a capsule. Boundary and recovery checks also
passed: clearing selection reported **Select at least one web tab.**; malformed
JSON reported **That file is not valid JSON.**; a 5,000,001-byte file was
rejected; a valid JSON import worked afterward; delete followed by Undo restored
the capsule. This used no real browser profile or user data.

## Accessibility, routes, privacy, and links

Playwright axe found 0 serious or critical violations on `/`, `/demo/`,
`/privacy/`, `/terms/`, and an unknown route at 390px. Each had one h1 and
one main landmark, no horizontal overflow, a visible first-tab skip link that
moved focus to main, and route-specific title/metadata. Reduced motion changes
smooth scrolling to `auto`.

The unknown route returned HTTP 404 with **Page not found — Tab Context
Capsule**, a clear h1, and home/demo links. The browser records its expected
failed-resource console line for that deliberate 404; it is not a page error.

Live responses have HSTS, CSP with `frame-ancestors 'none'`, X-Frame-Options,
Permissions-Policy, referrer policy, and `nosniff`. Hashed assets and the ZIP
are one-year immutable. The built manifest requests only `tabs` and
`storage`, has no host permissions or content scripts, and uses split
incognito mode. `robots.txt` and `sitemap.xml` are present and list the
public routes.

Every built-site internal and repository link returned 200. The Conductor
checkout link returns the already-disclosed billing-service 404 because product
registration is not enabled there. This is an operator-owned external
dependency, not a repository or deployed-product finding; the public offer and
fixture-based license behavior remain verified.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| 40px mobile tab-order controls | Fixed; the 390px extension regression passes its 44px minimum. |
| Immutable caching | Fixed; live fingerprinted assets and ZIP are immutable for one year. |
| Missing CSP, frame, and permissions protection | Fixed; all headers are live. |
| 390px privacy overflow | Fixed; all checked public routes measure 390px content at a 390px viewport. |
| Skip link did not move focus to main | Fixed on home, demo, legal pages, and 404. |
| No one-click isolated demo | Fixed and verified live with sample, label, reset, exit, and namespace isolation. |
| No claims registry or claim tests | Fixed; 11/11 declared commands pass independently. |
| Unknown routes returned home with HTTP 200 | Fixed; live unknown route is a designed HTTP 404. |
| First screen lacked the job, audience, and sample action | Fixed and verified cold on desktop and phone. |
| Metadata and standard header were incomplete | Fixed across public routes. |

## Scope

This is a static landing site and a local MV3 extension. It has no product
backend, tenant store, health endpoint, server rate limiter, SQLite mount, PWA
offline/update promise, CLI, library, or desktop artifact. Those backend and
consumer-artifact checks do not apply. The packaged extension was instead
integrity-checked and exercised as an unpacked artifact in a clean browser
profile.

