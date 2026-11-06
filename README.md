# GS1 Check Digit Calculator — Chrome extension

[![License: MIT](https://img.shields.io/badge/license-MIT-0f7b4a.svg)](LICENSE)

Calculate or verify the **GS1 check digit** for EAN-13, EAN-8, UPC-A and ITF-14 / GTIN-14 / SCC-14
codes without leaving the browser tab you are working in.

It is the popup version of the [check digit calculator on gtin14.com](https://gtin14.com/check-digit-calculator/):
same algorithm, same analysis, no network calls and **no permissions** — nothing you type leaves
the popup.

- Website — https://gtin14.com
- Full web tool — https://gtin14.com/check-digit-calculator/
- Bulk generator — https://gtin14.com/bulk-barcode-generator/

## What it does

- Four symbologies: EAN-13 / GTIN-13, EAN-8 / GTIN-8, UPC-A / GTIN-12, ITF-14 / GTIN-14 / SCC-14
- Payload in, check digit out; full code in, "valid" or the exact failing position out
- One-click repair when a single digit explains the failure (`Use 10012345678902`)
- GTIN-13 ↔ GTIN-14 conversion with a packaging indicator 0–9
- Copy buttons for both results

Everything runs in the popup. The extension requests **no permissions** and makes **no network
requests**, so no data leaves the browser and there is nothing to gate behind a privacy policy
beyond saying so.

## Why this exists

The GS1 check digit is a mod-10 sum with weights 3 and 1, and it is the single most common
reason a printed carton barcode fails the scanner. Every tool that helps catches this early, so
this one is MIT-licensed: fork it, embed the algorithm in your own WMS, or ship it in your own
extension.

## Build

The logic is not duplicated: `extension/codes.js` is compiled from the site's own
`lib/codes.ts`, which is the single source of truth for the GS1 mod-10 algorithm and the
"which position failed" analysis.

```bash
pnpm ext:build   # lib/codes.ts → extension/codes.js
pnpm ext:zip     # → dist/gtin14-check-digit.zip (what the Web Store accepts)
```

Re-run `ext:build` after touching `lib/codes.ts`. `pnpm check` asserts that the compiled file
exists and still exports `analyseCode`, `checkDigit` and `gtin13To14`.

## Load it locally

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → pick this `extension/` folder
3. Pin the icon, click it, type a code

Edge and other Chromium browsers accept the same folder. Firefox needs a different manifest
(`browser_specific_settings`, `background.scripts`) — not done here.

## Test it

The popup is a plain page, so it can be driven without installing the extension:

```bash
cd extension && python3 -m http.server 4399
# open http://127.0.0.1:4399/popup.html
```

Known-good values: `1001234567890` → digit `2` (full `10012345678902`);
`10012345678905` → position 14 should be 2; `4006381333931` → `14006381333938` with indicator 1.

## Publishing to the Chrome Web Store

Nothing here does this for you — it needs a paid developer account and a manual review.

1. One-time: register at https://chrome.google.com/webstore/devconsole ($5, one-off), verify
   the developer email.
2. `pnpm ext:zip`, then **New item** → upload `dist/gtin14-check-digit.zip`.
3. Listing copy (suggested): name `GS1 Check Digit Calculator`; summary `Calculate or verify the
   GS1 check digit for EAN-13, EAN-8, UPC-A and ITF-14 codes. Works offline, no account.`
   Category: Developer Tools. Language: English.
4. Assets: 128×128 icon (in repo), at least one 1280×800 or 640×400 screenshot of the popup.
5. Privacy: tick "does not collect user data" — it makes no requests, stores nothing. Fill the
   single-purpose statement with the line above.
6. Submit for review (usually a few days). Version bumps must increase `version` in
   `manifest.json`.

Until it is published, "Load unpacked" is enough for daily use — and the zip can be handed to
colleagues to load the same way.

## Repository layout

```
manifest.json   MV3 manifest — no permissions, no background worker
popup.html      popup markup
popup.css       popup styles (paper/ink palette from gtin14.com)
popup.js        popup logic: tabs, result states, repair, conversion
codes.ts        GS1 mod-10 algorithm + "which digit failed" analysis (synced from the site)
codes.js        compiled output of codes.ts, loaded by popup.js
icon-*.png      extension icons
```

## License

MIT — see [LICENSE](LICENSE). GS1 is a registered trademark of GS1 AISBL; this extension is not
affiliated with GS1 and does not issue company prefixes.
