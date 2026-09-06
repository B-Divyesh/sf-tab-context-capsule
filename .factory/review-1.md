# Save selected browser tabs with context — PASS

**Implementation reviewed:** `59d506adabf8ff16fa115ee0e5bf7a188a25b142`  
**Documentation HEAD before this review:** `b5b4345a7fde0f415e8f450b374790414199fb72`  
**Live URL:** https://tab-context-capsule.sociobot.in/  
**Reviewed:** 2026-09-06 UTC  
**Verdict:** **PASS — 0 findings and 0 untested public claims.**

No product code was changed during this review.

The job is clear before scrolling: save selected browser tabs with their
purpose. The audience is researchers and knowledge workers who need to close a
browser project and resume it later. The first action is **Try it with sample
data**. It opens a populated, isolated research capsule.

## Review basis

I read the full repository QA report in `.factory/verification-5.md`, the brief,
design thesis, demo contract, claims registry, copy audit, README, legal pages,
and every earlier repository verification report. The separately named
`factory-evidence/tab-context-capsule-verify-5/qa-report.md` mount was not
present at its repository or `/work` path. This review did not rely on that
missing copy: all required checks below were run again against the clean tree,
built artifact, and live product.

Commits after `59d506a` change only reports and handoff documentation. Rebuilt
home, demo, privacy, terms, 404, and versioned ZIP bytes match the live product,
so `59d506a` is the implementation reviewed.

## Clean setup and artifact checks

| Check | Fresh result |
| --- | --- |
| `npm ci` | Passed; 270 packages audited, 0 vulnerabilities. |
| `npm run check` | Passed; TypeScript and 8/8 Vitest tests. |
| `npm run build` | Passed; extension, deterministic ZIP, and static site emitted under `dist/`. |
| ZIP integrity | `unzip -t` passed for `tab-context-capsule-1.0.0.zip`. |
| Full browser suite | Passed: 18/18. |
| Claim commands | All 11 were run separately; each selected one tagged test and passed. |
| Repeat build | ZIP SHA-256 remained `6aad32a59e98d1333c501c6f9460e6662172a7600f0b142ca0d81bddf0183244`. |
| Built/live identity | Home, demo, privacy, terms, 404, and ZIP matched byte-for-byte. |

The built MV3 manifest requests only `tabs` and `storage`, uses split incognito
mode, and contains no host permissions or content scripts. The unpacked build
was loaded in a new temporary Chromium profile; no real profile or user data
was used.

## Public claims

Every command in `.factory/claims.json` passed as an independent invocation
after the clean setup.

| Claim | Result |
| --- | --- |
| `capture-context` | Passed — name, notes, order, and next step were saved. |
| `close-by-choice` | Passed — original tabs stayed open until the checked action was confirmed. |
| `markdown-export` | Passed — the download contained the heading, next step, notes, and ordered links. |
| `json-roundtrip` | Passed — delete and import restored the same capsule. |
| `local-storage` | Passed — demo changes used one demo key and preserved a real-data sentinel. |
| `no-url-transmission` | Passed — capture sent no capsule data to another origin. |
| `no-account-analytics` | Passed — capture needed no sign-in or analytics and the manifest stayed minimal. |
| `private-opt-in` | Passed — the private sample was excluded by default and the choice reset after capture. |
| `free-core` | Passed — capture, reopen, import, and both exports worked without a license. |
| `conductor-offer` | Passed — the public offer states $12 once and the two paid conveniences. |
| `license-check` | Passed — only the token was sent and an automatic check was not repeated within a day. |

The landing page, demo, privacy page, terms, extension copy, and README were
cross-checked against this registry. There are no additional untested public
claims.

## Fresh live desktop and phone checks

Fresh 1440×900 desktop and 390×844 phone contexts both showed this before any
scroll:

- Job: **Save selected tabs with their purpose**.
- Audience: researchers and knowledge workers closing a browser project.
- First action: **Try it with sample data**.

The action ended at 806 px in the 900 px desktop viewport and 549 px in the 844
px phone viewport. Both pages had no horizontal overflow and loaded only the
product origin.

The one-click sample opened **Coastal erosion sources** with three ordered
public links, page-specific notes, and the next step **Compare the two shoreline
datasets before Thursday’s meeting.** The **Demo — sample data, nothing is
saved** label remained visible at the bottom of the page.

In each fresh context I seeded `capsules:v1`, saved a temporary demo capsule,
reset the demo, and selected **Start for real**. Reset restored the single
bundled capsule. Leaving removed
`demo:tab-context-capsule:capsules:v1` and left the real-data sentinel unchanged.

## Normal, invalid, boundary, and recovery paths

The unpacked extension captured two regular live pages with a name, page note,
order, and next step. The Markdown download contained the recorded context.
Keyboard activation moved a tab and returned focus to that tab's remaining
order control.

Recovery checks passed in the same fresh profile:

- Clearing selection reported **Select at least one web tab.**
- Malformed JSON reported **That file is not valid JSON.**
- A 5,000,001-byte file reported the 5 MB limit.
- A valid JSON import worked after both errors.
- Delete followed by **Undo** restored the capsule.

The popup had no page errors or horizontal overflow. Its order controls measured
48×48 CSS pixels, axe found 0 serious or critical violations, and reduced motion
shortened its view animation to `0.001ms` (`1e-06s` in Chromium's computed
form).

## Accessibility, routes, privacy, and performance

The factory URL verifier passed live: HTTP 200, a useful title, `lang=en`, one
h1, a main landmark, complete image alt coverage, no unlabeled buttons, and no
console or page errors.

Fresh Playwright axe checks found 0 serious or critical violations on `/`,
`/demo/`, `/privacy/`, `/terms/`, and an unknown route at 390 px. Each public
route has one h1, one main landmark, route-specific metadata, a standard header,
and 390 px content in a 390 px viewport. The first Tab reaches a visible skip
link and Enter moves focus to main. A 720 px layout, equivalent to 200% browser
zoom from a 1440 px desktop, reflowed every public route without horizontal
overflow. Reduced motion changes smooth scrolling to `auto`.

The unknown route returned HTTP 404 with **Page not found — Tab Context
Capsule**, the h1 **This page does not exist**, and working home/demo actions.
Chromium records one expected failed-resource console line for the deliberate
404 response; there is no page error or broken page.

Live responses include HSTS, `nosniff`, a strict referrer policy, a CSP with
`frame-ancestors 'none'`, `X-Frame-Options: DENY`, and a restrictive
Permissions-Policy. Fingerprinted assets and the versioned ZIP use one-year
immutable caching. `robots.txt` and `sitemap.xml` are present; the sitemap lists
home, demo, privacy, and terms.

All internal site links, the ZIP, source repository, and issue tracker returned
200. The Conductor checkout link returns the already disclosed billing-service
404 because operator-side product registration is not enabled. This external
dependency is not a repository or deployed-product defect.

Fresh mobile Lighthouse reported 100 Performance, 100 Accessibility, 100 Best
Practices, and 100 SEO; FCP 0.9 s, LCP 1.4 s, TBT 0 ms, and CLS 0. Lighthouse
emitted its known post-report browser-tab-crash warning after writing the scores.
Site JavaScript is 12.59 KB uncompressed, CSS is 16.33 KB, and the mobile hero
is 32.10 KB AVIF or 57.80 KB WebP.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| 40 px mobile tab-order controls | Fixed; fresh unpacked measurement is 48×48 px. |
| Missing immutable caching | Fixed; live hashed assets and versioned ZIP are immutable for one year. |
| Missing CSP, frame, and permissions protection | Fixed; all required headers are live. |
| 390 px privacy overflow | Fixed; every checked route fits 390 px exactly. |
| Skip link did not focus main | Fixed on home, demo, privacy, terms, and 404. |
| No one-click isolated demo | Fixed; sample, persistent label, reset, exit, and storage isolation passed live. |
| No claims registry or claim tests | Fixed; all 11 commands pass independently. |
| Unknown routes returned home with HTTP 200 | Fixed; unknown routes return the designed HTTP 404. |
| First screen lacked the job, audience, and sample action | Fixed on fresh desktop and phone contexts. |
| Metadata and standard header were incomplete | Fixed across all public routes. |

## Scope decisions

This is a static site and local MV3 browser extension. It has no product
backend, tenant store, health endpoint, server rate limiter, SQLite mount, PWA
offline/update promise, CLI, library, or desktop artifact. Those checks do not
apply. The browser extension was instead rebuilt, integrity-checked, loaded
unpacked, and exercised in a clean consumer profile.

The brief explicitly makes generated summaries a non-goal. The real job depends
on the user's reason for keeping each page, so adding AI is not an obvious
missing step.
