# Verification handoff — Tab Context Capsule

## FAIL

Candidate `d406b69b6568e6800a23588e03e8515bd089fb1c` was independently verified
on 2026-08-28 against https://tab-context-capsule.sociobot.in/. It is **not
approved** because the mobile tab-order controls are 40×40px at the required
390px viewport, below the explicit 44×44px touch-target acceptance minimum.

The core job is otherwise working: clean install, typecheck, 7 unit tests,
production build, 2 site E2E tests, independent live axe checks, unpacked MV3
capture/save/close/reopen/export/delete/Undo smoke flow, and live/candidate
artifact hashes all passed. The live deployment exactly matches the candidate:
home HTML SHA-256 `85db5e24075162686561f98f126ae5e2bec52f56d86405e5808c1d54f4b6981a`
and extension ZIP SHA-256
`a49f558a4c2045da6e4f4e36911a6afd1608707c90250c31fe625beb68b6d4a2`.

See `.factory/verification.md` for exact commands, end-to-end evidence,
privacy/network analysis, live headers, performance results, and defects.

## Required next steps

1. Increase the tab move buttons to at least 44×44 CSS px and re-verify at
   390px.
2. Configure immutable long-lived caching for fingerprinted static assets and
   add CSP, Permissions-Policy, and frame-ancestors/XFO response hardening.
3. Re-run the verification report after the new candidate is deployed.
