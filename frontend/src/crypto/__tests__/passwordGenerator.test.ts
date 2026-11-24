/// <reference types="node" />

/**
 * Unit and security test suite for passwordGenerator.
 */

import { test } from "node:test";
import { strict as assert } from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatePassword } from "../passwordGenerator.ts";
import { WORDLIST } from "../../features/generator/wordlist.ts";
import {
  AMBIGUOUS,
  DEFAULT_PASSPHRASE_OPTIONS,
  DEFAULT_PASSWORD_OPTIONS,
  DEFAULT_PIN_OPTIONS,
  DIGITS,
  LOWERCASE,
  SYMBOLS,
  UPPERCASE,
} from "../../features/generator/generatorPresets.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cryptoDir = path.resolve(__dirname, "..");
const generatorDir = path.resolve(__dirname, "../../features/generator");

test("T-01: length=20 all classes -> length === 20", () => {
  const pwd = generatePassword(DEFAULT_PASSWORD_OPTIONS);
  assert.equal(pwd.length, 20);
});

test("T-02: length=8 lowercase only -> every char is a-z", () => {
  const pwd = generatePassword({
    mode: "password",
    length: 8,
    includeLowercase: true,
    includeUppercase: false,
    includeDigits: false,
    includeSymbols: false,
    avoidAmbiguous: false,
  });
  assert.equal(pwd.length, 8);
  assert.match(pwd, /^[a-z]{8}$/);
});

test("T-03: length=20 all classes -> at least one of each class", () => {
  for (let i = 0; i < 50; i++) {
    const pwd = generatePassword(DEFAULT_PASSWORD_OPTIONS);
    assert.ok(/[a-z]/.test(pwd), "Must contain lowercase");
    assert.ok(/[A-Z]/.test(pwd), "Must contain uppercase");
    assert.ok(/[0-9]/.test(pwd), "Must contain digit");
    assert.ok(/[!@#$%^&*()-_=+[\]{};:,.<>?/|]/.test(pwd), "Must contain symbol");
  }
});

test("T-04: avoidAmbiguous=true -> no char in Il1O0o", () => {
  for (let i = 0; i < 50; i++) {
    const pwd = generatePassword({
      ...DEFAULT_PASSWORD_OPTIONS,
      avoidAmbiguous: true,
    });
    for (const char of AMBIGUOUS) {
      assert.ok(!pwd.includes(char), `Password should not contain ambiguous char ${char}`);
    }
  }
});

test("T-05: no classes selected -> throws", () => {
  assert.throws(
    () =>
      generatePassword({
        mode: "password",
        length: 16,
        includeLowercase: false,
        includeUppercase: false,
        includeDigits: false,
        includeSymbols: false,
        avoidAmbiguous: false,
      }),
    /At least one character class must be selected/
  );
});

test("T-06: length=8 all 4 classes -> does not throw", () => {
  assert.doesNotThrow(() =>
    generatePassword({
      mode: "password",
      length: 8,
      includeLowercase: true,
      includeUppercase: true,
      includeDigits: true,
      includeSymbols: true,
      avoidAmbiguous: false,
    })
  );
});

test("T-07: length=3 all 4 classes -> throws", () => {
  assert.throws(
    () =>
      generatePassword({
        mode: "password",
        length: 3,
        includeLowercase: true,
        includeUppercase: true,
        includeDigits: true,
        includeSymbols: true,
        avoidAmbiguous: false,
      }),
    /Length too short for selected character classes/
  );
});

test("T-08: passphrase 4 words sep '-' -> split('-').length === 4", () => {
  const phrase = generatePassword(DEFAULT_PASSPHRASE_OPTIONS);
  const words = phrase.split("-");
  assert.equal(words.length, 4);
  for (const word of words) {
    assert.ok(WORDLIST.includes(word), `Word ${word} must be from wordlist`);
  }
});

test("T-09: passphrase capitalize -> every word starts uppercase", () => {
  const phrase = generatePassword({
    ...DEFAULT_PASSPHRASE_OPTIONS,
    capitalize: true,
  });
  const words = phrase.split("-");
  assert.equal(words.length, 4);
  for (const word of words) {
    assert.match(word, /^[A-Z][a-z]*$/);
    assert.ok(WORDLIST.includes(word.toLowerCase()));
  }
});

test("T-10: pin length=6 -> /^[0-9]{6}$/", () => {
  const pin = generatePassword(DEFAULT_PIN_OPTIONS);
  assert.equal(pin.length, 6);
  assert.match(pin, /^[0-9]{6}$/);
});

test("T-11: pin noRepeats length=10 -> unique digits, length 10", () => {
  const pin = generatePassword({
    mode: "pin",
    length: 10,
    noRepeats: true,
  });
  assert.equal(pin.length, 10);
  assert.match(pin, /^[0-9]{10}$/);
  assert.equal(new Set(pin).size, 10);
});

test("T-12: pin noRepeats length=11 -> throws", () => {
  assert.throws(
    () =>
      generatePassword({
        mode: "pin",
        length: 11,
        noRepeats: true,
      }),
    /noRepeats requires length <= 10/
  );
});

test("T-13 (advisory): statistical class frequency within tolerance", () => {
  let lower = 0;
  let upper = 0;
  let digits = 0;
  let symbols = 0;

  for (let i = 0; i < 500; i++) {
    const pwd = generatePassword(DEFAULT_PASSWORD_OPTIONS);
    for (const char of pwd) {
      if (LOWERCASE.includes(char)) lower++;
      else if (UPPERCASE.includes(char)) upper++;
      else if (DIGITS.includes(char)) digits++;
      else if (SYMBOLS.includes(char)) symbols++;
    }
  }

  const total = lower + upper + digits + symbols;
  assert.equal(total, 500 * 20);
  assert.ok(lower / total > 0.1, `Lowercase proportion too low: ${lower / total}`);
  assert.ok(upper / total > 0.1, `Uppercase proportion too low: ${upper / total}`);
  assert.ok(digits / total > 0.05, `Digits proportion too low: ${digits / total}`);
  assert.ok(symbols / total > 0.1, `Symbols proportion too low: ${symbols / total}`);
});

test("T-14 (advisory): statistical letter frequency within tolerance", () => {
  const letterCounts: Record<string, number> = {};
  for (const c of LOWERCASE) {
    letterCounts[c] = 0;
  }

  for (let i = 0; i < 300; i++) {
    const pwd = generatePassword({
      mode: "password",
      length: 20,
      includeLowercase: true,
      includeUppercase: false,
      includeDigits: false,
      includeSymbols: false,
      avoidAmbiguous: false,
    });
    for (const char of pwd) {
      letterCounts[char] = (letterCounts[char] ?? 0) + 1;
    }
  }

  for (const c of LOWERCASE) {
    assert.ok(
      (letterCounts[c] ?? 0) > 20,
      `Letter '${c}' appeared too few times (${letterCounts[c]}) in 6000 draws`
    );
  }
});

test("T-15: generate twice -> at least one of 20 draws differs", () => {
  const samples = new Set<string>();
  for (let i = 0; i < 20; i++) {
    samples.add(generatePassword(DEFAULT_PASSWORD_OPTIONS));
  }
  assert.ok(samples.size > 1, "Expected random draws to differ");
});

test("T-16: source grep for 'Math.random' in passwordGenerator.ts -> zero matches", () => {
  const filePath = path.join(cryptoDir, "passwordGenerator.ts");
  const content = fs.readFileSync(filePath, "utf8");
  const count = (content.match(/Math\.random/g) || []).length;
  assert.equal(count, 0, "passwordGenerator.ts must not contain Math.random");
});

test("T-17: source grep for 'console.' in passwordGenerator.ts and features/generator/** -> zero matches", () => {
  const filesToCheck = [
    path.join(cryptoDir, "passwordGenerator.ts"),
    path.join(generatorDir, "types.ts"),
    path.join(generatorDir, "generatorPresets.ts"),
    path.join(generatorDir, "wordlist.ts"),
  ];

  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, "utf8");
    const count = (content.match(/console\./g) || []).length;
    assert.equal(count, 0, `${file} must not contain console.*`);
  }
});

test("T-18: source grep for 'localStorage' / 'sessionStorage' in features/generator/** and crypto/passwordGenerator.ts -> zero matches", () => {
  const filesToCheck = [
    path.join(cryptoDir, "passwordGenerator.ts"),
    path.join(generatorDir, "types.ts"),
    path.join(generatorDir, "generatorPresets.ts"),
    path.join(generatorDir, "wordlist.ts"),
  ];

  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, "utf8");
    const localCount = (content.match(/localStorage/g) || []).length;
    const sessionCount = (content.match(/sessionStorage/g) || []).length;
    assert.equal(localCount, 0, `${file} must not contain localStorage`);
    assert.equal(sessionCount, 0, `${file} must not contain sessionStorage`);
  }
});

test("T-19: unsupported mode throws via exhaustiveness guard", () => {
  const bogus = { mode: "unknown" } as unknown as Parameters<
    typeof generatePassword
  >[0];
  assert.throws(
    () => generatePassword(bogus),
    /Unsupported generator mode/
  );
});
