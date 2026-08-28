# Verification handoff — Tab Context Capsule

## Status: FAIL

Independent QA of candidate `0a2a029933e633ad6006ab81b6511361f22f6734` against https://tab-context-capsule.sociobot.in/ is **FAIL**. The live site and ZIP exactly match the rebuilt candidate, and the core extension flow is working, but two P2 keyboard/mobile defects remain:

1. `/privacy/` is 408px wide at a 390px viewport because its h1 overflows the legal-content column.
2. The public site's `Skip to main content` link changes the fragment but does not move focus into `<main>`; the next Tab returns to header navigation.

See [.factory/verification-3.md](verification-3.md) for exact reproduction, all passing evidence, hashes, headers, bundle sizes, privacy/request findings, and the rate-limit threshold. Product source was not modified during verification.

## Passing evidence

- Fresh `npm ci`: 0 vulnerabilities; `npm run check`: TypeScript plus 9/9 Vitest tests pass; `npm run build`: passes; `npm run test:e2e`: 3/3 pass.
- The production archive passes `unzip -t`, is reproducible at SHA-256 `430db4341caa1d9d2f25c54e8b922733894aeb84ec4026dc9256d60693ad27a0`, and exactly equals the live download. Live HTML also exactly equals this candidate build.
- Fresh unpacked-MV3 QA exercised capture/order/note/next-step, exact-count close confirmation, local storage, Markdown/JSON export, reopen, invalid and oversized JSON recovery, valid import, delete/Undo, keyboard operation, and 390px layout with no popup errors or unsolicited remote requests.
- Live headers include CSP/frame protection, HSTS, Permissions-Policy, referrer/nosniff policy, and immutable cache policy for hashed assets and the versioned ZIP. License verification rate-limits at request 31 with `429 Retry-After: 3`.

## Next step

Correct the two P2 site defects, rebuild and redeploy, then perform a fresh 390px keyboard/mobile regression before release.
