# Chrome Web Store listing

Copy-paste source for the submission form. Screenshots in this folder are 1280×800.

## Name (45 char max)

```
GS1 Check Digit Calculator
```

## Summary (132 char max)

```
Calculate or verify the GS1 check digit for EAN-13, EAN-8, UPC-A and ITF-14 codes. Offline, no signup, no tracking.
```

## Detailed description

```
Paste a code into the toolbar popup and get an answer, without opening another tab.

WHAT IT DOES
• Four symbologies: EAN-13 / GTIN-13, EAN-8 / GTIN-8, UPC-A / GTIN-12, ITF-14 / GTIN-14 / SCC-14
• Payload in, check digit out — works from 12, 7, 11 or 13 digits
• Full code in, valid or not out — and when it is wrong, the popup names the exact position: "position 14 should be 2, you entered 5"
• One-click repair when a single wrong digit explains the failure
• GTIN-13 ↔ GTIN-14 conversion with a packaging indicator from 0 to 9
• Copy buttons for both results

HOW IT WORKS
The check digit is a GS1 mod-10 sum: working left from the check digit, digits get weight 3 and 1 in alternation, then the total is subtracted from the next multiple of ten. This extension implements that in the popup.

PRIVACY
Everything runs on your device. The extension asks for no permissions, makes no network requests and stores nothing. What you type stays in the popup.

MORE
Full web tools, including a bulk generator for up to 100 codes from a CSV: https://gtin14.com
Check digit calculator page: https://gtin14.com/check-digit-calculator/

Open source (MIT): https://github.com/larrygofast89/gtin14-check-digit
Not affiliated with GS1 AISBL.
```

## Category & language

- Category: Developer Tools (alternative: Productivity)
- Language: English

## Links

- Homepage: https://gtin14.com
- Support / contact: larrygofast89@gmail.com
- Privacy policy: https://gtin14.com/privacy/ (see note below)

## Privacy practices

- Single purpose: "Calculate or verify the GS1 check digit of a barcode number."
- Data usage: tick **none** of the collection boxes — the extension has no permissions, no network calls, no storage.
- Justification (if asked): "The extension is a pure calculator. It reads only the digits typed into its own popup and never transmits or persists them."

## Note on the privacy policy URL

Chrome asks for one whenever the listing touches user data. If we want to keep the listing simple we can
avoid it, but a one-page policy on the site is safer: it also gives the store listing another place to
link gtin14.com.
