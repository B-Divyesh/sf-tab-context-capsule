# Tab Context Capsule

Save selected browser tabs with their notes, order, and a next step. Reopen the
project later or export it for another person.

The extension is for researchers and knowledge workers who need to close a
browser project without losing why each page mattered. It uses local extension
storage and requires no account.

Try the isolated sample at
[tab-context-capsule.sociobot.in/demo/](https://tab-context-capsule.sociobot.in/demo/).
The demo uses only `demo:tab-context-capsule:capsules:v1`; **Reset demo** and
**Start for real** remove that sample namespace.

## What ships

- A Chrome-compatible MV3 extension built with WXT and TypeScript.
- Capture with tab selection, ordering, page notes, a next step, and confirmed
  closing of original tabs.
- A local capsule library with reopen, Markdown export, JSON export/import,
  validated recovery, delete, and Undo.
- Private tabs excluded by default. Inclusion is per capture and is not
  remembered.
- A responsive product site with an isolated demo, privacy and terms pages, and
  a designed HTTP 404 page.
- An optional $12 USD one-time Conductor license. It adds one-click Markdown
  copy and brass and jade capsule colors. The free core remains available
  without a license.

The extension does not transmit capsule URLs, names, notes, or exports. It has
no account, analytics, advertising SDK, content scripts, or host permissions.
Its only optional remote request sends a user-provided license token to the
Sociobot verification endpoint. Automatic checks run at most once per day.

All public product claims and their outcome tests are listed in
[.factory/claims.json](.factory/claims.json). Demo isolation is documented in
[.factory/demo.md](.factory/demo.md).

## Develop

Requirements: Node.js 20+, npm, and Xvfb for headed extension browser tests on
Linux. Playwright 1.58.2 is pinned; the factory image supplies its Chromium.

```sh
npm ci
npm run dev          # WXT extension development
npm run dev:site     # product site
npm test             # unit and release-config tests
npm run check        # TypeScript plus unit tests
```

## Build and test

Run the clean release setup:

```sh
npm ci
npm run check
npm run build
npm run test:e2e -- --reporter=list
```

Then run every command in `.factory/claims.json`. Each command selects exactly
one `@claim:<id>` browser test.

Build output:

- `dist/extension/` — unpacked MV3 extension.
- `dist/site/` — static deploy root.
- `dist/site/downloads/tab-context-capsule-1.0.0.zip` — deterministic,
  versioned extension package.

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**,
and select `dist/extension`. The packaged ZIP is unsigned; browser-store
signing is handled outside this repository.

Preview the production static output after building:

```sh
npm run preview:site
```

The local preview applies a real 404 response for unknown paths, matching the
production route outcome. Deploy `dist/site/` through the factory's durable
`sf-tab-context-capsule` static-site configuration. This repository does not
change DNS, billing registration, or shared infrastructure.

## Privacy and permissions

The manifest requests only `tabs` and `storage`. `tabs` reads the current
window and reopens saved pages. `storage` keeps capsules locally. Review the
[privacy policy](site/privacy/index.html) and [terms](site/terms/index.html).

## Design and provenance

The product-specific art-deco transit system and generated-art provenance are
documented in [.factory/design.md](.factory/design.md). Source artwork and its
prompt are in `assets/src/`.

## License

[MIT](LICENSE)
