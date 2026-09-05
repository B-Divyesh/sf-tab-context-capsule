# Independent verification 4 — FAIL

**Implementation reviewed:** `aafb434819476a3945d2906df1f770e6f37fc5aa` (`fix: repair mobile legal layout and skip focus`)  
**Documentation candidate:** `b8b4130952607f7f1f336bec869874c3087b6884` (`docs: record repair 3 verification evidence`)  
**Live URL:** https://tab-context-capsule.sociobot.in/  
**Verified:** 2026-09-05 UTC  
**Verdict:** **FAIL** — **5 findings** and **11 untested public claims** remain. Do not release as PASS.

The product job is to save selected browser tabs with their reason, order, and next step so researchers and knowledge workers can resume or hand off a project. The intended first action is a one-click sample. On both fresh desktop and 390px phone sessions, the visible first action was instead **Download the extension**; no sample action appeared before scrolling.

## Fresh checkout and build evidence

A detached fresh clone of `main` resolved to the documentation SHA above. `npm ci` completed with 0 audit vulnerabilities. No product code was modified during verification.

| Check | Result |
| --- | --- |
| `npm run check` | Passed: TypeScript plus 9/9 Vitest tests. |
| `npm run build` | Passed: emitted `dist/extension`, `dist/site`, and both ZIP names. |
| `unzip -t dist/site/downloads/tab-context-capsule-1.0.0.zip` | Passed. |
| `npm run test:e2e -- --reporter=list` | Passed: 4/4 browser tests. |
| Build/live identity | Home HTML SHA-256 `3c5112db…fb192655`, privacy HTML SHA-256 `2b26402f…1c6d07`, and versioned ZIP SHA-256 `430db434…93ad27a0` matched byte-for-byte. |
| Live Lighthouse mobile | 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; FCP 0.8 s, LCP 1.4 s, TBT 60 ms, CLS 0. |
| Live basic accessibility | `verify-url.sh` passed with title, `lang=en`, one h1, main landmark, image alt coverage, and no browser console errors. Playwright axe at desktop and 390px found 0 serious/critical issues on `/`, `/privacy/`, and `/terms/`. The standalone axe CLI could not locate a system Chrome binary; the installed Playwright Chromium was used instead. |

## Extension exercise

I loaded the freshly built MV3 extension unpacked in a new temporary Chromium profile at 390px. All data and downloads were removed with that profile after the test; no real browser data was used or changed.

- Normal path passed: two local HTTP tabs were selected, reordered by keyboard, given a name, next step, and note, then saved to `chrome.storage.local`.
- Markdown and JSON export passed. The Markdown download contained the recorded next step.
- Delete and Undo passed.
- Invalid JSON was rejected with `That file is not valid JSON.` A 5,000,001-byte import was rejected with the 5 MB limit. A valid JSON import then succeeded (`Imported 1 capsule.`), proving recovery.
- The popup produced no console/page errors. The existing 4/4 suite also passed the 44×44px control, popup axe, local persistence, and keyboard-order regression.

The direct extension exercise first checked the import result without waiting for the asynchronous file handler and read a false negative. Repeating that isolated recovery test with the UI completion wait passed; this is test timing, not a product defect.

## Live routes, privacy, and policy

- Fresh desktop and phone pages made only same-origin product requests before any optional purchase action. No analytics, CDN fonts, or third-party scripts loaded.
- `/`, `/privacy/`, `/terms/`, the versioned download, source repository, and issue tracker returned 200. The checkout endpoint returned the documented 404. This is the known external billing-registration issue and is **not** counted as a product defect.
- The live extension asset, stylesheet, image, and versioned ZIP have `Cache-Control: public, max-age=31536000, immutable`. CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, referrer policy, and Permissions-Policy are present.
- This is a static landing site and a local MV3 extension, not a product backend. Tenant isolation, restart persistence, health endpoint, and product-side rate-limit checks do not apply. No product backend exists to restart or probe. The external billing API is outside repository/deployment control.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| 44px mobile tab-order controls | Fixed. Fresh built-popup browser test passed every order control at least 44×44px. |
| Immutable asset caching | Fixed. Live hashed JS/CSS/image assets and versioned ZIP return one-year immutable caching. |
| CSP, frame protection, and Permissions-Policy | Fixed. All required live headers are present. |
| 390px privacy heading overflow | Fixed. Live `innerWidth` and `documentElement.scrollWidth` are both 390. |
| Skip link did not focus main | Fixed. On `/`, `/privacy/`, and `/terms/`, Tab then Enter moved focus to `<main id="main">`. |

## Findings

### P1 — The required one-click demo sandbox does not exist

**Reproduction:** Open the live landing page in a new desktop or 390px phone context. There is no **Try it with sample data** action on the first screen. Open `https://tab-context-capsule.sociobot.in/demo`: it returns 200 but is the ordinary landing page, with no realistic populated output, no persistent `Demo — sample data, nothing is saved` label, no **Reset demo**, no **Start for real**, and no demo storage namespace.

**Impact:** The required try-before-install path cannot be exercised, so the requested sample, reset, and no-real-data checks cannot be completed. The landing page's static example is not an interactive sandbox.

### P1 — The required claims registry is absent, leaving 11 public claims untested

**Reproduction:** The clean checkout has no `.factory/claims.json`; `rg` found no `@claim:` test tags, demo namespace, or sample action. Therefore there are no declared claim commands to run from a clean setup.

**Untested-claim count: 11.** These are distinct visitor-facing promises in the landing page, legal pages, or README: selected tabs are captured with explanation/order/next step; originals close only when chosen; Markdown export is readable; JSON export/import is lossless; data is local extension storage; URLs never transmit; no analytics/account; private tabs are opt-in and the choice is not remembered; free capture/reopen/import/export is unlimited; Conductor is $12 once with the listed unlocks; and license verification sends only a token at most daily.

Some functions have ordinary unit or end-to-end coverage, but none have the required one-to-one tagged, demo-entry-point claim test. This remains an untested-claims release blocker.

### P2 — Unknown routes return the home page, not a real 404 page

**Reproduction:** Open `https://tab-context-capsule.sociobot.in/does-not-exist` on desktop or phone. It returns HTTP 200 and renders the home title and home h1. `/404.html` is also the home page. The static configuration has a navigation fallback but no 404 response override or designed 404 document.

**Impact:** A bad address has no accurate status, route title, explanation, or way back specific to the error. This fails the required real 404 route.

### P2 — The first screen does not state the job, audience, and first action in plain words

**Reproduction:** Before scrolling, the home h1 is `Stop now. Resume with the reason intact.` The eyebrow says `A local departure board for overloaded tabs`; the primary action is download. The screen does not say it saves selected browser tabs, does not name researchers or knowledge workers, and offers no sample action. Several section labels and headings use the train metaphor rather than the required plain task labels.

**Impact:** A cold mobile visitor cannot learn the job, intended user, and first action within the required first screen.

### P3 — Required page metadata and standard header structure are incomplete

**Reproduction:** The home title is 62 characters, exceeding the 60-character limit. None of the live pages has Open Graph or Twitter-card metadata. The home header has How it works, Conductor, and Download but no Demo or Privacy link; legal headers likewise omit a Demo link.

**Impact:** The public routes do not meet the stated metadata and standard navigation contract.

## Required follow-up

Implement an isolated, one-click demo entry point with the specified persistent label, reset/start-for-real controls, realistic sample, and a separate storage namespace. Add `.factory/claims.json` and one tagged demo test per public promise, or remove any promise that cannot be tested. Add a real 404 response and page. Rewrite the first screen and navigation in plain words, then complete the missing metadata. Re-run this verification from a fresh checkout after deployment.
