# Independent verification — FAIL

**Candidate:** `d406b69b6568e6800a23588e03e8515bd089fb1c` (`build: make extension archive deterministic`)  
**Live URL:** https://tab-context-capsule.sociobot.in/  
**Verified:** 2026-08-28 UTC  
**Verdict:** **FAIL** — the core product and deployment are healthy, but the
390px mobile extension UI fails the supplied 44×44px touch-target acceptance
requirement for its tab-order controls.

## Evidence collected independently

The verification used a new detached clean clone at the candidate SHA, ran
`npm ci`, and did not alter product source. Install completed with 0 audit
vulnerabilities.

| Check | Fresh result |
| --- | --- |
| Type/lint gate | `npm run check` passed: `tsc --noEmit` and 7/7 Vitest tests |
| Production build | `npm run build` passed and generated `dist/extension`, `dist/site`, and the download ZIP |
| Build reproducibility | Two clean production builds produced the identical ZIP SHA-256: `a49f558a4c2045da6e4f4e36911a6afd1608707c90250c31fe625beb68b6d4a2` |
| Site regression tests | `npm run test:e2e` passed 2/2, including its axe serious/critical check |
| Independent live axe | Desktop and 390px mobile: 0 serious/critical findings, 0 console/page errors |
| Lighthouse (live, mobile) | Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0s, LCP 1.4s, TBT 0ms, CLS 0 |
| Bundle budgets | Extension JS 19,696 B / CSS 10,728 B; site JS 2,440 B / CSS 10,229 B; mobile AVIF 32,099 B and WebP 57,800 B — all below budget |

## End-to-end browser-extension exercise

Loaded the generated `dist/extension` unpacked into a fresh Chromium profile at
390px. The MV3 worker loaded successfully. The flow created two regular HTTP
tabs, selected and reordered them, added a per-tab note and next step, and
confirmed closing the exact selected originals. It then verified all of the
following:

- saved capsule appears in local `chrome.storage.local` only;
- ordering, note, trimmed name, and next step persist;
- Markdown download includes the capsule heading and tab meaning;
- reopening creates both saved tabs;
- delete confirmation followed by Undo restores the capsule;
- clearing selection reports `Select at least one web tab.` and recovery works;
- malformed JSON import reports `That file is not valid JSON.` and leaves the
  saved capsule usable;
- no popup/page console errors;
- popup axe reports 0 serious/critical findings;
- keyboard Tab reaches the skip link with a visible 3px focus outline;
- `prefers-reduced-motion: reduce` reduces the view animation to 0.001ms;
- no horizontal overflow at 390px (`scrollWidth` 375, viewport 390).

Private-window behavior was also code/manifest reviewed: the manifest is
`incognito: "split"`; private tabs are excluded unless the per-capture checkbox
is deliberately enabled, and that state resets after save. It was not possible
to programmatically grant Chromium's user-controlled extension-incognito
permission in this container.

## Privacy, deployment, and policy checks

- The inspected final manifest requests only `tabs` and `storage`; there are no
  content scripts or host permissions. Its only optional remote request in
  source is license verification after a user supplies a token. Capsule URLs,
  notes, and names are not attached to that request.
- Fresh desktop and 390px live browser traces made requests only to
  `https://tab-context-capsule.sociobot.in` before the optional license flow;
  there were no analytics, CDN font, or third-party script requests.
- Live home HTML SHA-256 exactly equals this candidate's built HTML:
  `85db5e24075162686561f98f126ae5e2bec52f56d86405e5808c1d54f4b6981a`.
  The live extension download has the exact identical ZIP hash above and
  `unzip -t` passed. The deployment therefore matches the candidate.
- Live responses are HTTPS and include HSTS, `Referrer-Policy:
  strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`.
  The hero AVIF renders at desktop and 390px despite the server labelling it
  `application/octet-stream`.

## Defects

### P2 — mobile touch controls are below the stated minimum

**Repro:** Load the unpacked extension at a 390px viewport, then inspect any
`Move <tab> up/down` control. Fresh Chromium measurement: **40×40 CSS px**.
The visual thesis and attached accessibility acceptance both require controls
to be at least **44×44 CSS px**. This affects the only controls for ordering
tabs, a core capture function, and fails the explicit acceptance contract.

### P3 — static deployment cache policy is not immutable for fingerprinted assets

The hashed JS/CSS, ZIP, and image all return `Cache-Control: public,
must-revalidate, max-age=30`; they are not long-lived immutable assets as the
performance acceptance specifies. This did not hurt the fresh-load Lighthouse
result, but it causes needless repeat validation/download work. Configure the
host to serve fingerprinted `/assets/*` and the versioned distribution archive
with a long immutable TTL, while retaining short revalidation for HTML.

### P3 — response hardening is partial

The live response lacks `Content-Security-Policy`, `Permissions-Policy`, and
clickjacking protection (`X-Frame-Options` or CSP `frame-ancestors`). Existing
HSTS/referrer/nosniff headers are present. This is host configuration work,
not a product-source change, but should be completed before release.

## Scope notes

This is a browser extension, not a library/CLI, PWA, or backend; pack/install,
service-worker offline-update, concurrency, and backend health checks do not
apply. The MV3 extension archive was instead integrity-tested and loaded as an
unpacked real extension.
