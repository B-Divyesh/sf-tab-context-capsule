# Tab Context Capsule

Tab Context Capsule is a local-first browser extension for researchers and
knowledge workers who need to stop a project without losing why its tabs were
open. Select tabs from the current window, name the context, add a note to each
page and a next step, then safely close the originals. Capsules can be reopened
or exported as readable Markdown and lossless JSON.

The product site is planned for
[tab-context-capsule.sociobot.in](https://tab-context-capsule.sociobot.in).

## What ships

- Chrome-compatible MV3 extension built with WXT and TypeScript.
- Local capsule library with ordering, notes, next steps, reopen, confirmed
  close, delete/undo, Markdown/JSON export, and validated JSON import.
- Private tabs excluded unless explicitly included for the current capture;
  the preference is never persisted.
- Responsive static product, privacy, and terms pages.
- Optional $12 one-time Conductor license via the Sociobot billing API. All
  capture, reopen, import, and export features remain free.

Capsules and browsing URLs never leave the browser. The only runtime request
made by the extension is an optional license-token verification; no capsule
data is attached.

## Develop

Requirements: Node.js 20+ and npm.

```sh
npm ci
npm run dev          # WXT extension development
npm run dev:site     # product site at the printed local URL
npm test             # unit tests
npm run check        # TypeScript + unit tests
```

## Build and install

The reproducible factory build command is:

```sh
npm ci
npm run build
```

Outputs:

- `dist/extension/` — unpacked MV3 extension
- `dist/site/` — static deploy root (`index.html` is at this exact root)
- `dist/site/downloads/tab-context-capsule-1.0.0.zip` — versioned packaged
  extension with immutable caching (the legacy `tab-context-capsule.zip` URL
  remains available for existing links)

To test locally in Chromium, open `chrome://extensions`, enable Developer mode,
choose **Load unpacked**, and select `dist/extension`. The packaged ZIP is for
distribution; browser-store signing is handled outside this repository.

Run browser and accessibility checks after building:

```sh
npm run test:e2e
```

`test:e2e` uses `xvfb-run` so Chromium can load the unpacked MV3 extension;
install Xvfb when running that browser suite outside the factory Linux image.

## Privacy and permissions

The extension requests only `tabs` and `storage`. `tabs` reads the current
window when the popup is opened and creates tabs when a capsule is reopened.
`storage` keeps capsules locally. There are no content scripts, trackers,
remote fonts, or browsing-history analytics. Review [the privacy policy](site/privacy/index.html)
and [terms](site/terms/index.html).

## Design and provenance

The art-deco “last night train” visual system and generated-art provenance are
documented in [.factory/design.md](.factory/design.md). Source artwork and its
exact prompt are in `assets/src/`.

## License

[MIT](LICENSE)
