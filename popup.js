import {
  FORMAT_SPEC,
  analyseCode,
  checkDigit,
  digitsOnly,
  gtin13To14,
  gtin14To13,
} from "./codes.js";

const TABS = ["gtin-13", "gtin-8", "gtin-12", "gtin-14"];

const codeInput = document.getElementById("code");
const codeLabel = document.getElementById("code-label");
const codeHint = document.getElementById("code-hint");
const resultBox = document.getElementById("result");
const resultValue = document.getElementById("result-value");
const resultLine = document.getElementById("result-line");
const copyButton = document.getElementById("copy");
const fixButton = document.getElementById("fix");
const convertInput = document.getElementById("convert-code");
const convertIndicator = document.getElementById("convert-indicator");
const convertedValue = document.getElementById("converted-value");
const copyConverted = document.getElementById("copy-converted");
const tabs = [...document.querySelectorAll(".tab")];

let format = "gtin-14";
let lastCopyable = "";

function setState(state) {
  resultBox.classList.toggle("is-ok", state === "ok");
  resultBox.classList.toggle("is-error", state === "error");
}

function renderTab() {
  const spec = FORMAT_SPEC[format];
  for (const tab of tabs) {
    tab.setAttribute("aria-selected", String(tab.dataset.format === format));
  }
  codeLabel.textContent = `${spec.label} — payload or full code (${spec.length} digits)`;
  codeHint.textContent =
    spec.length === 14
      ? "Enter 13 digits to calculate the check digit, or 14 to verify them."
      : `Enter ${spec.length - 1} digits to calculate the check digit, or ${spec.length} to verify them.`;
  codeInput.placeholder = format === "gtin-14" ? "10012345678902" : "";
}

function renderResult() {
  const raw = codeInput.value.trim();
  const digits = digitsOnly(raw);
  const expected = FORMAT_SPEC[format].length;
  const payloadLength = expected - 1;

  fixButton.hidden = true;
  fixButton.textContent = "Use it";
  lastCopyable = "";
  copyButton.disabled = true;

  if (digits.length === 0) {
    setState("");
    resultValue.textContent = "—";
    resultLine.textContent = "Paste a code to see the check digit.";
    return;
  }

  if (digits.length === payloadLength) {
    const digit = checkDigit(digits);
    const full = `${digits}${digit}`;
    setState("ok");
    resultValue.textContent = String(digit);
    resultLine.textContent = `Check digit is ${digit} — full code ${full}`;
    lastCopyable = full;
    copyButton.disabled = false;
    return;
  }

  const analysis = analyseCode(digits, format);
  if (analysis.ok) {
    const digit = analysis.actualCheckDigit ?? analysis.expectedCheckDigit;
    setState("ok");
    resultValue.textContent = "Valid";
    resultLine.textContent = `Check digit ${digit} is correct — ${digits}`;
    lastCopyable = digits;
    copyButton.disabled = false;
    return;
  }

  setState("error");
  resultValue.textContent = "Not valid";
  resultLine.textContent = analysis.message;
  if (analysis.digitFix) {
    const fixedDigits =
      digits.slice(0, analysis.digitFix.position - 1) +
      analysis.digitFix.to +
      digits.slice(analysis.digitFix.position);
    fixButton.hidden = false;
    fixButton.textContent = `Use ${fixedDigits}`;
    fixButton.onclick = () => {
      codeInput.value = fixedDigits;
      renderResult();
      codeInput.focus();
    };
  }
}

function renderConversion() {
  const digits = digitsOnly(convertInput.value.trim());
  const indicator = convertIndicator.value;

  if (digits.length === 0) {
    convertedValue.textContent = "—";
    return;
  }
  if (digits.length === 13) {
    convertedValue.textContent = gtin13To14(digits, indicator);
    return;
  }
  if (digits.length === 14) {
    convertedValue.textContent = gtin14To13(digits);
    return;
  }
  convertedValue.textContent = "—";
}

async function copy(text, button) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return;
  }
  const original = button.textContent;
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = original;
  }, 900);
}

codeInput.addEventListener("input", renderResult);
convertInput.addEventListener("input", renderConversion);
convertIndicator.addEventListener("change", renderConversion);

for (const tab of tabs) {
  tab.addEventListener("click", () => {
    const next = tab.dataset.format;
    if (!TABS.includes(next) || next === format) return;
    format = next;
    renderTab();
    renderResult();
    codeInput.focus();
  });
}

copyButton.addEventListener("click", () => copy(lastCopyable, copyButton));
copyConverted.addEventListener("click", () =>
  copy(digitsOnly(convertedValue.textContent ?? ""), copyConverted),
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") window.close();
});

renderTab();
renderResult();
renderConversion();
codeInput.focus();
