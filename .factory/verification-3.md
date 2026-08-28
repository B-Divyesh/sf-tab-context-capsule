# Independent verification 3 — FAIL

**Candidate:** `0a2a029933e633ad6006ab81b6511361f22f6734` (`docs: record repair deployment evidence`)  
**Live URL:** https://tab-context-capsule.sociobot.in/  
**Verified:** 2026-08-28 UTC  
**Verdict:** **FAIL** — the core local-first capsule product, build, deployment identity, privacy posture, security headers, cache policy, and rate limiting pass, but the live site fails two explicit keyboard/mobile acceptance requirements.

## Fresh checkout and build evidence

The worktree was clean and at the candidate SHA before testing. `npm ci` completed with 0 vulnerabilities (270 packages audited). No product source was changed.

| Gate | Fresh result |
| --- | --- |
| Type/unit/config | `npm run check` passed: `tsc --noEmit`; Vitest **9/9** passed. |
| Production build | `npm run build` passed and emitted `dist/extension`, `dist/site`, and the ZIP. |
| Browser integration | `npm run test:e2e -- --reporter=list` passed **3/3**. |
| Archive | `unzip -t dist/site/downloads/tab-context-capsule-1.0.0.zip` passed. |
| Reproducibility | Second build produced the same ZIP SHA-256: `430db4341caa1d9d2f25c54e8b922733894aeb84ec4026dc9256d60693ad27a0`. |
| Budgets | Extension JS **19,603 B**, CSS **10,729 B**; site JS **2,440 B**, CSS **10,229 B**; mobile hero AVIF **32,099 B** / WebP **57,800 B** — within stated limits. |
| Built-site smoke | `/opt/fleet/lib/verify-url.sh` against the preview passed: HTTP 200, title/lang/one h1/main/image alt, and zero console/page errors. |

## Independent extension end-to-end exercise

I loaded freshly built `dist/extension` as an unpacked MV3 extension in a new Chromium profile at **390×844**, using two ordinary local HTTP tabs.

- Normal flow passed: two selected tabs were named, given a next step and a per-tab note, reordered with keyboard Enter, sealed, and stored in `chrome.storage.local`.
- The destructive flow gave the exact prompt `Save this capsule, then close 2 selected tabs?`; accepting it closed the originals only after persistence.
- Markdown and JSON downloads contained the expected heading, next step, URLs, and note. Reopen created both saved tabs.
- Boundary/recovery checks passed: no selection reports `Select at least one web tab.`; an unsafe `file:///` import is rejected; a valid JSON import succeeds afterward; a 5,000,001-byte file is rejected; delete plus Undo restores the capsule.
- There were **0** popup console/page errors, **0** unsolicited popup remote requests without a license token, and no popup horizontal overflow at 390px. Popup axe found **0 serious/critical** findings. Its skip target is focusable and reduced motion sets animation duration to 0.001ms.

Private windows cannot be enabled programmatically because Chromium treats the extension permission as user-controlled. Manifest/source review confirms `incognito: "split"`; private tabs are excluded by default, opt-in is per capture, and it resets after saving.

## Live deployment, privacy, and service policy

- Live `/` SHA-256 is `fa34c9d0ab1aceba71fb052d6475956de33b6efbc74d22077f148033d02e1f7e`, exactly matching this candidate's rebuilt `dist/site/index.html`.
- Live `/downloads/tab-context-capsule-1.0.0.zip` SHA-256 is `430db4341caa1d9d2f25c54e8b922733894aeb84ec4026dc9256d60693ad27a0`, exactly matching the rebuilt ZIP.
- Live desktop and 390px traces of `/`, `/privacy/`, and `/terms/` had zero console/page errors and requested only `https://tab-context-capsule.sociobot.in` resources. There are no tracker, CDN font, or third-party script requests. The fresh extension made no network request without a license token.
- Playwright axe found **0 serious/critical** violations on all three live pages and the popup. The standalone axe CLI could not start its Selenium Chrome in this container; direct Playwright axe used the installed browser and is the reported result.
- Mobile Lighthouse produced Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP **1.0 s**, LCP **1.4 s**, TBT **0 ms**, CLS **0**. Lighthouse emitted a post-report browser-tab-crash warning, so these scores are supporting rather than verdict evidence.
- Live responses are HTTPS with HSTS, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, and restrictive Permissions-Policy. HTML is short-revalidated; hashed assets and the versioned ZIP are `public, max-age=31536000, immutable`.
- The extension manifest requests only `tabs` and `storage`, with no host permissions/content scripts. Its only optional remote action is Sociobot license-token verification; source review confirms it does not attach capsule names, notes, URLs, or titles. There is no sign-in, so Entra validation does not apply.
- Sociobot verification endpoint rate limiting passed: a rapid sequence returned **200 for requests 1–30** and **429 on request 31**, with `Retry-After: 3` and `X-RateLimit-After: 3`.

This is a browser extension, not a PWA, library/CLI, or application backend; service-worker offline update, clean consumer install, and application persistence/concurrency checks do not apply. The MV3 worker and packaged/unpacked artifact were tested instead.

## Defects

### P2 — 390px privacy page has horizontal layout overflow

**Repro:** Open `https://tab-context-capsule.sociobot.in/privacy/` at 390px wide. `document.documentElement.scrollWidth` and `document.body.scrollWidth` are **408px**, while `innerWidth` is **390px**. The legal main is 350px wide but its h1 has `scrollWidth: 388px`; the uppercase `CONSTRUCTION.` overflows. `body { overflow-x: hidden; }` masks the excess instead of making the legal page fit. At the same viewport, `/` and `/terms/` measure 390px. This fails the mobile/no-horizontal-overflow requirement.

### P2 — public-site skip link does not move focus into main

**Repro:** At 390px or desktop, Tab to `Skip to main content` and press Enter. The URL becomes `#main`, but `document.activeElement` becomes `BODY` because `<main id="main">` is not programmatically focusable. The next Tab goes to header Download rather than into main. The visible link and focus styling exist, but its destination is not a keyboard focus target. This fails the stated skip-link-to-main and keyboard-only requirements.

## Required follow-up

Fix the legal h1 wrapping/overflow at 390px and make the public-site main skip target focusable (for example, `tabindex="-1"` with appropriate focus handling). Rebuild, redeploy, and perform a fresh mobile keyboard regression before releasing.
