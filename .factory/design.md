# Tab Context Capsule — visual thesis

## Direction: the last night train

The product is an **art-deco transit poster made operational**. A capsule is a
small, deliberate carriage that carries the useful context out of a crowded
station of tabs. The interface borrows the confidence, geometry, route lines,
ticket punches, and condensed display type of 1930s rail graphics without
imitating any historical brand. Decoration always explains state: parallel
rails mean ordered tabs, the punched lozenge means a saved capsule, and station
labels distinguish capture, library, and handoff.

This is intentionally a single dark treatment. It represents a calm night
station after an overloaded working day, keeps browser favicons visually quiet,
and gives the coral ticket/action color excellent contrast.

## Tokens

- `--ink: #081c25` — painted midnight platform; global background.
- `--ink-raised: #102e38` — enamel surface and field background.
- `--paper: #f5e8c8` — warm timetable paper; primary text.
- `--paper-muted: #c9bea3` — secondary copy (7.4:1 on ink).
- `--signal: #ff765f` — signal coral; primary action (5.7:1 on ink).
- `--signal-deep: #a92f2f` — danger and punched marks.
- `--brass: #f5bd4f` — route emphasis and focus (9.4:1 on ink).
- `--jade: #55c6a9` — saved/success status.
- `--warning: #ffd27a`; `--danger: #ff8b7a`.

Surfaces use solid paint, hairline brass rules, and sparse paper grain. There
are no gradients: the period-poster depth comes from concentric geometry,
offset rules, and flat overlapping fields.

## Type

- Display: `Arial Narrow`, `Aptos Narrow`, `Roboto Condensed`, system sans;
  uppercase, tracked, never below 15 px. Its timetable compression is used only
  for headings and station labels.
- Body: `Avenir Next`, `Segoe UI`, system sans; 16 px minimum and 1.55 leading.

System-resident stacks avoid network font requests and keep the entire extension
portable. The scale is 14 label / 16 body / 20 lead / 28 section / clamp(36–72)
display. Reading measure is 64 characters.

## Spacing and shape

The base unit is 4 px; working intervals are 8, 12, 16, 24, 32, 48, and 64.
Corners are clipped rather than softly rounded: 2 px fields, 8 px panels, and
999 px ticket pills only where the railway-token metaphor is explicit. Controls
are at least 44 px high, adjacent actions are separated by 8 px, and the popup
fits 390 px without horizontal scrolling.

## Interaction grammar

- Capture is a three-stop line: **Select tabs → Explain → Seal capsule**.
- Tab rows are ordered tracks. Up/down controls move a carriage exactly one
  position and return focus to that carriage.
- Saving stamps a capsule into the library and announces it in a live region.
- Opening a capsule is always explicit. Closing captured originals is a separate
  unchecked action with exact-count confirmation.
- Export is a detachable ticket: Markdown is human handoff; JSON is lossless
  backup/import.
- Destructive deletion requires a named confirmation and offers an Undo ticket.

## Motion

UI transitions last 180–240 ms and animate only opacity/transform. Views arrive
along the horizontal track; a saved status stamp scales once from 0.94. No
ambient or looping motion. Under `prefers-reduced-motion: reduce`, transitions
and smooth scroll become instant and state is conveyed through borders, text,
and opacity only.

## Responsive intent

The extension popup is the primary workbench at 390–480 px. At narrow widths,
tab metadata stacks and secondary actions become a two-column ticket grid. The
landing site moves its rail diagram below the proposition and collapses the
three-step route vertically. Nothing depends on hover.

## Asset plan and provenance

The landing hero uses one original generated poster illustration: a stylized
night station where browser-page tickets travel inside a transparent geometric
capsule carriage. The image clarifies the product promise without depicting
features the extension lacks. It is cropped responsively, emitted as AVIF/WebP,
and held under 300 KB.

**Prompt sheet:** “Original vertical art-deco transit poster illustration,
midnight railway platform interpreted as a browser workspace, a single geometric
capsule-shaped train carriage carrying five abstract paper page cards along
parallel brass rails, crisp flat screen-print shapes, subtle ink grain, strong
architectural symmetry, deep petrol navy, warm ivory, signal coral, brass gold,
jade accents, dramatic hard-edged pools of light, no people, no text, no letters,
no numbers, no logos, no watermark, no browser brand marks, no gradients,
no photorealism.”

- Generator: Azure OpenAI factory image deployment via
  `/opt/fleet/lib/gen-image.sh`.
- Date: 2026-08-28.
- License/provenance: original product-specific generated artwork; no reference
  image or third-party copyrighted character/brand used.
- Source prompt and generation metadata live beside the selected PNG in
  `assets/src/hero-poster.json`.

Hand-authored SVG marks (capsule lozenge, rails, arrows) are original and use the
same geometric vocabulary. Generated-imagery disclosure appears in the footer.
