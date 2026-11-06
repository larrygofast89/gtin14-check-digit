/**
 * GENERATED FILE — do not edit.
 *
 * Synced from lib/codes.ts in the gtin14.com repository by `pnpm ext:build`.
 * The site and the extension must agree on the GS1 mod-10 algorithm character
 * for character, so they share one source instead of two lookalike copies.
 */

export type CodeFormat = "gtin-14" | "gtin-13" | "gtin-12" | "gtin-8";

export const FORMAT_SPEC: Record<
  CodeFormat,
  { length: number; label: string; aliases: string[] }
> = {
  "gtin-14": {
    length: 14,
    label: "GTIN-14 / ITF-14",
    aliases: ["itf-14", "scc-14", "ean-14", "gtin-14", "gtin14"],
  },
  "gtin-13": {
    length: 13,
    label: "EAN-13 / GTIN-13",
    aliases: ["ean-13", "ean13", "gtin-13", "gtin13"],
  },
  "gtin-12": {
    length: 12,
    label: "UPC-A / GTIN-12",
    aliases: ["upc-a", "upca", "upc", "gtin-12", "gtin12"],
  },
  "gtin-8": {
    length: 8,
    label: "EAN-8 / GTIN-8",
    aliases: ["ean-8", "ean8", "gtin-8", "gtin8"],
  },
};

export const FORMAT_ORDER: CodeFormat[] = ["gtin-14", "gtin-13", "gtin-12", "gtin-8"];

export function digitsOnly(input: string): string {
  return input.replace(/\D+/g, "");
}

/** Check digit for a payload that does not yet contain its check digit. */
export function checkDigit(payload: string): number {
  const digits = digitsOnly(payload);
  if (digits.length === 0) throw new Error("checkDigit: empty payload");
  let sum = 0;
  let weight = 3;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    sum += (digits.charCodeAt(i) - 48) * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return (10 - (sum % 10)) % 10;
}

/** Append the check digit to a payload. */
export function withCheckDigit(payload: string): string {
  const digits = digitsOnly(payload);
  return digits + String(checkDigit(digits));
}

export function formatForLength(length: number): CodeFormat | null {
  const found = FORMAT_ORDER.find((format) => FORMAT_SPEC[format].length === length);
  return found ?? null;
}

export function isValidCheckDigit(fullCode: string): boolean {
  const digits = digitsOnly(fullCode);
  if (digits.length < 2) return false;
  const expected = checkDigit(digits.slice(0, -1));
  return expected === digits.charCodeAt(digits.length - 1) - 48;
}

export type DigitFix = { position: number; from: string; to: string };

export type CodeAnalysis = {
  ok: boolean;
  input: string;
  digits: string;
  /** 1-based length of the checked code, 0 when unknown. */
  expectedLength: number;
  detectedFormat: CodeFormat | null;
  expectedCheckDigit: number | null;
  actualCheckDigit: number | null;
  message: string;
  /** A single substitution that would make the code valid, when one exists. */
  digitFix: DigitFix | null;
  /** Two adjacent digits that look swapped, when one exists. */
  transposition: [number, number] | null;
};

/**
 * Analyse a code as typed by a human. Reports the failing position in plain
 * language ("position 14 should be 7, you entered 1") and, when exactly one
 * single-digit substitution repairs the code, names that digit too.
 */
export function analyseCode(
  raw: string,
  expectedFormat?: CodeFormat,
): CodeAnalysis {
  const trimmed = raw.trim();
  const digits = digitsOnly(trimmed);
  const format = expectedFormat ?? formatForLength(digits.length);
  const expectedLength = format ? FORMAT_SPEC[format].length : digits.length;

  const base: CodeAnalysis = {
    ok: false,
    input: trimmed,
    digits,
    expectedLength,
    detectedFormat: format,
    expectedCheckDigit: null,
    actualCheckDigit: null,
    message: "",
    digitFix: null,
    transposition: null,
  };

  if (digits.length === 0) {
    return { ...base, message: "Paste a barcode first — digits only." };
  }
  if (/[^0-9\s-]/.test(trimmed)) {
    return {
      ...base,
      message: "Barcodes contain digits only. Remove letters, dots and other characters.",
    };
  }
  if (!format) {
    return {
      ...base,
      message: `${digits.length} digits is not a GTIN length. GS1 codes are 8, 12, 13 or 14 digits long.`,
    };
  }
  if (digits.length !== expectedLength) {
    return {
      ...base,
      message: `${digits.length} digits entered, but ${FORMAT_SPEC[format].label} needs ${expectedLength}.`,
    };
  }

  const payload = digits.slice(0, -1);
  const actual = digits.charCodeAt(digits.length - 1) - 48;
  const expected = checkDigit(payload);

  if (expected === actual) {
    return {
      ...base,
      ok: true,
      expectedCheckDigit: expected,
      actualCheckDigit: actual,
      message: `Valid ${format ? FORMAT_SPEC[format].label : "code"} — check digit ${expected} is correct.`,
    };
  }

  // Look for a single-character fix. GS1's mod-10 catches every single-digit
  // error, so exactly one substitute digit can normally repair the code.
  const fixes: DigitFix[] = [];
  for (let i = 0; i < digits.length; i += 1) {
    for (let d = 0; d <= 9; d += 1) {
      const candidate = digits.slice(0, i) + d + digits.slice(i + 1);
      if (candidate === digits) continue;
      if (isValidCheckDigit(candidate)) {
        fixes.push({ position: i + 1, from: digits[i], to: String(d) });
      }
    }
  }

  // A swapped pair produces the same check-digit failure; it is the more likely
  // human error, so report it before a generic substitution.
  let transposition: [number, number] | null = null;
  for (let i = 0; i < digits.length - 1; i += 1) {
    if (digits[i] === digits[i + 1]) continue;
    const swapped = digits.slice(0, i) + digits[i + 1] + digits[i] + digits.slice(i + 2);
    if (isValidCheckDigit(swapped)) {
      transposition = [i + 1, i + 2];
      break;
    }
  }

  const checkDigitFix = fixes.find((fix) => fix.position === digits.length) ?? null;
  const onlyOtherFix = fixes.filter((fix) => fix.position !== digits.length);

  let message: string;
  if (transposition) {
    message = `Check digit ${actual} is wrong. Digits ${transposition[0]} and ${transposition[1]} look swapped — try “${(
      digits.slice(0, transposition[0] - 1) +
      digits[transposition[1] - 1] +
      digits[transposition[0] - 1] +
      digits.slice(transposition[1])
    )}”.`;
  } else if (checkDigitFix) {
    message = `Check digit error: position ${digits.length} should be ${checkDigitFix.to}, you entered ${actual}.`;
  } else if (onlyOtherFix.length === 1) {
    message = `Check digit should be ${expected}, but the valid check digit only works if digit ${onlyOtherFix[0].position} is ${onlyOtherFix[0].to} instead of ${onlyOtherFix[0].from}.`;
  } else {
    message = `Check digit error: position ${digits.length} should be ${expected}, you entered ${actual}.`;
  }

  return {
    ...base,
    expectedCheckDigit: expected,
    actualCheckDigit: actual,
    message,
    digitFix: checkDigitFix ?? (onlyOtherFix.length === 1 ? onlyOtherFix[0] : null),
    transposition,
  };
}

/** GTIN-13 → GTIN-14 by prefixing the packaging indicator (0–8). */
export function gtin13To14(gtin13: string, indicator = "1"): string {
  const digits = digitsOnly(gtin13);
  if (digits.length !== 13) throw new Error("GTIN-13 must have 13 digits");
  if (!/^[0-8]$/.test(indicator)) throw new Error("Packaging indicator must be 0–8");
  return withCheckDigit(indicator + digits.slice(0, 12));
}

/** GTIN-14 → GTIN-13 by dropping the packaging indicator and re-checking. */
export function gtin14To13(gtin14: string): string {
  const digits = digitsOnly(gtin14);
  if (digits.length !== 14) throw new Error("GTIN-14 must have 14 digits");
  return withCheckDigit(digits.slice(1, 13));
}

export type NormalisedCode =
  | { ok: true; code: string; note: string }
  | { ok: false; message: string };

/**
 * Turn whatever a user typed into a 14-digit GTIN-14 with a correct check digit.
 *
 * The three real-world inputs are:
 *   • 14 digits — a complete code, which must already check out;
 *   • 13 digits — either a GTIN-13 (its own check digit is valid) or the payload
 *     of a GTIN-14 (no check digit yet); the check digit tells us which;
 *   • 12 digits — an item reference, promoted with the packaging indicator.
 */
export function normaliseToGtin14(raw: string, indicator = "1"): NormalisedCode {
  const digits = digitsOnly(raw);
  if (/[^0-9\s-]/.test(raw.trim())) {
    return { ok: false, message: "Use digits only — remove letters and punctuation." };
  }

  if (digits.length === 14) {
    const analysis = analyseCode(digits, "gtin-14");
    if (analysis.ok) return { ok: true, code: digits, note: "" };
    if (analysis.digitFix) {
      const fixed =
        digits.slice(0, analysis.digitFix.position - 1) +
        analysis.digitFix.to +
        digits.slice(analysis.digitFix.position);
      return {
        ok: true,
        code: fixed,
        note: `Digit ${analysis.digitFix.position} corrected to ${analysis.digitFix.to}`,
      };
    }
    return { ok: false, message: analysis.message };
  }

  if (digits.length === 13) {
    if (isValidCheckDigit(digits)) {
      return {
        ok: true,
        code: gtin13To14(digits, indicator),
        note: `GTIN-13 converted to GTIN-14 with indicator ${indicator}`,
      };
    }
    return { ok: true, code: withCheckDigit(digits), note: "Check digit added" };
  }

  if (digits.length === 12) {
    // 12 digits is an item reference: promote it with the packaging indicator,
    // which gives the 13-digit payload a GTIN-14 check digit belongs to.
    return {
      ok: true,
      code: withCheckDigit(indicator + digits),
      note: `12-digit item reference promoted with indicator ${indicator}`,
    };
  }

  return {
    ok: false,
    message: `${digits.length} digits is not a GTIN length. Enter 12, 13 or 14 digits.`,
  };
}
