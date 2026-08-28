# Repair handoff — Tab Context Capsule

## Status

Repaired the findings reported against candidate
`d406b69b6568e6800a23588e03e8515bd089fb1c`. This handoff accompanies the
repair commit on `main`; pushing it triggers the existing static deployment of
`dist/site`.

## Repairs

- **P2 touch target:** the capture-order buttons are now a physical 48×48 CSS
  pixels with an 8px separation (above the 44×44 requirement). The tab-head
  track reserves their full 104px width and the 390px layout intentionally
  places the controls on a second row, avoiding horizontal overflow.
- **Keyboard ordering:** after a keyboard move re-renders the list, focus now
  returns to the moved tab's still-enabled order control. This handles the
  endpoint case where the direction just used becomes disabled.
- **P3 cache policy:** `site/public/staticwebapp.config.json`, emitted at the
  static deploy root, gives fingerprinted `/assets/*` files and the versioned
  extension archive a one-year immutable cache policy. HTML remains on the
  host's normal revalidation policy; the legacy unversioned archive remains a
  compatibility URL.
- **P3 response hardening:** the same static deployment configuration provides
  CSP (`frame-ancestors 'none'`), `X-Frame-Options: DENY`, a restrictive
  `Permissions-Policy`, `Referrer-Policy`, and `X-Content-Type-Options`.

## Regression coverage

`tests/e2e/extension.spec.ts` loads the freshly built archive as a real
unpacked MV3 extension under Chromium/Xvfb. At desktop and 390px it verifies
the popup has no overflow; at 390px it measures every order button at at least
44×44 CSS pixels, runs axe with zero serious/critical findings, activates a
move with Enter and verifies retained focus, saves a capsule to
`chrome.storage.local`, exports Markdown, and confirms delete/Undo. The test
captures popup console errors. `tests/release-config.test.ts` also asserts the
48px source guard and static cache/security-header rules.

## Verification performed

All commands ran from a fresh `npm ci` installation (0 audit vulnerabilities):

- `npm run check` — passed: TypeScript and **9/9** Vitest unit/config tests.
- `npm run build` — passed: MV3 extension, deterministic package, and static
  site. Extension JavaScript is 19.60 KB and CSS is 10.73 KB; site JavaScript
  is 2.44 KB and CSS is 10.23 KB.
- `npm run test:e2e -- --reporter=list` — passed **3/3**: desktop + 390px site,
  site axe, and unpacked extension desktop + 390px/keyboard/axe/core-flow
  coverage.
- `unzip -t dist/site/downloads/tab-context-capsule-1.0.0.zip` — passed.
  Two clean production builds produced the same archive SHA-256:
  `430db4341caa1d9d2f25c54e8b922733894aeb84ec4026dc9256d60693ad27a0`.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ …` against the built
  preview — HTTP 200, title/lang/one h1/main/image alt checks passed, 0 console
  errors; mobile and desktop screenshots rendered.
- Mobile Lighthouse against that built preview — Performance **100**,
  Accessibility **100**, Best Practices **100**, SEO **100**.

Privacy remains local-first: the extension manifest requests only `tabs` and
`storage`; no content scripts, host permissions, trackers, CDN fonts, or URL
transmission were introduced. The optional license verification remains the
only remote extension request after a user supplies a token.

## Deployment and follow-up

The deployment class remains static (`npm run build` → `dist/site`), with the
static-web-app configuration shipped inside that exact output. After the push,
recheck `https://tab-context-capsule.sociobot.in/` for the immutable asset and
versioned ZIP headers plus CSP, Permissions-Policy, and XFO; those headers are
host-applied and cannot be observed from Vite preview. Private-window
permission is still browser-user-controlled and cannot be granted
programmatically in this container; the manifest remains `incognito: "split"`
and capture is opt-in per session.
