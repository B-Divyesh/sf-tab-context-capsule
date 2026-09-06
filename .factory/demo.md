# Demo sandbox

## Entry point

Open `https://tab-context-capsule.sociobot.in/demo/` or run the site locally
and open `http://127.0.0.1:4173/demo/`.

The landing page links to this route with **Try it with sample data**. It needs
no install, account, license, or setup.

## Sample data

The demo starts with one saved research capsule, **Coastal erosion sources**.
It contains three ordered public-source links, page-specific notes, and a next
step. A separate sample browser window contains three public urban-heat
research tabs and one clearly marked private sample tab.

The workbench supports reorder, notes, capture, optional close confirmation,
reopen, Markdown export, JSON export/import, delete, and recovery by reset.

## Isolation and reset

The demo reads and writes only:

```text
demo:tab-context-capsule:capsules:v1
```

It never reads or writes the extension's `chrome.storage.local` data. **Reset
demo** deletes the demo prefix and restores the bundled sample. **Start for
real** deletes the demo prefix before downloading the extension. Private sample
inclusion is in memory and resets after every capture.

The tagged `@claim:local-storage` browser test seeds a non-demo storage
sentinel, changes and exits the demo, and proves the sentinel remains unchanged.

