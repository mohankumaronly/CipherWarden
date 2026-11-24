/**
 * Cryptographically secure password, passphrase, and PIN generator.
 */

import type { GeneratorOptions, PasswordOptions } from "../features/generator/types.ts";
import {
  AMBIGUOUS,
  DIGITS,
  LOWERCASE,
  SYMBOLS,
  UPPERCASE,
} from "../features/generator/generatorPresets.ts";
import { WORDLIST } from "../features/generator/wordlist.ts";

/**
 * Draws an unbiased random integer in the range [0, maxExclusive).
 * Uses crypto.getRandomValues with rejection sampling to eliminate modulo bias.
 */
function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) {
    throw new Error("maxExclusive must be positive");
  }

  if (maxExclusive <= 256) {
    const buf = new Uint8Array(1);
    let byte: number;
    do {
      crypto.getRandomValues(buf);
      byte = buf[0]!;
      // Discard values in the incomplete final bucket to eliminate modulo bias
    } while (byte >= 256 - (256 % maxExclusive));
    return byte % maxExclusive;
  }

  // 32-bit rejection sampling for larger domains (e.g. wordlist with 1296 entries)
  const buf = new Uint32Array(1);
  let val: number;
  do {
    crypto.getRandomValues(buf);
    val = buf[0]!;
    // Discard values in the incomplete final bucket to eliminate modulo bias
  } while (val >= 4294967296 - (4294967296 % maxExclusive));
  return val % maxExclusive;
}

/**
 * Picks a random item from a readonly array using cryptographically secure randomInt.
 */
function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(arr.length)]!;
}

/**
 * In-place Fisher-Yates shuffle driven by cryptographically secure randomInt.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

/**
 * Filters characters based on the ambiguous character set rule.
 * Serves as the single source of truth for ambiguous-character exclusion.
 */
function filterAmbiguous(chars: string, avoidAmbiguous: boolean): string {
  if (!avoidAmbiguous) return chars;
  return chars
    .split("")
    .filter((c) => !AMBIGUOUS.includes(c))
    .join("");
}

/**
 * Builds the composite character set for password mode based on selected options.
 */
function buildCharset(opts: PasswordOptions): string {
  let charset = "";
  if (opts.includeLowercase) charset += LOWERCASE;
  if (opts.includeUppercase) charset += UPPERCASE;
  if (opts.includeDigits) charset += DIGITS;
  if (opts.includeSymbols) charset += SYMBOLS;
  return filterAmbiguous(charset, opts.avoidAmbiguous);
}

/**
 * Generates a cryptographically secure password, passphrase, or PIN.
 *
 * Uses crypto.getRandomValues with rejection sampling; never uses non-cryptographic PRNG.
 *
 * @param options - Generator options configuring the generation mode and constraints
 * @returns The generated credential string
 * @throws Error when options are invalid or impossible to satisfy
 */
export function generatePassword(options: GeneratorOptions): string {
  switch (options.mode) {
    case "password": {
      const charset = buildCharset(options);
      if (charset.length === 0) {
        throw new Error("At least one character class must be selected");
      }

      const selectedClasses: string[] = [];
      if (options.includeLowercase) {
        selectedClasses.push(filterAmbiguous(LOWERCASE, options.avoidAmbiguous));
      }
      if (options.includeUppercase) {
        selectedClasses.push(filterAmbiguous(UPPERCASE, options.avoidAmbiguous));
      }
      if (options.includeDigits) {
        selectedClasses.push(filterAmbiguous(DIGITS, options.avoidAmbiguous));
      }
      if (options.includeSymbols) {
        selectedClasses.push(filterAmbiguous(SYMBOLS, options.avoidAmbiguous));
      }

      for (const cls of selectedClasses) {
        if (cls.length === 0) {
          throw new Error("Length too short for selected character classes");
        }
      }

      if (options.length < selectedClasses.length) {
        throw new Error("Length too short for selected character classes");
      }

      const required = selectedClasses.map((cls) => pick(cls.split("")));
      const remaining = options.length - required.length;
      const result = [...required];
      const charsetChars = charset.split("");
      for (let i = 0; i < remaining; i++) {
        result.push(pick(charsetChars));
      }

      shuffle(result);
      return result.join("");
    }

    case "passphrase": {
      const validSeparators = ["-", "_", ".", " "];
      if (
        !Number.isInteger(options.wordCount) ||
        options.wordCount < 3 ||
        options.wordCount > 10 ||
        !validSeparators.includes(options.separator)
      ) {
        throw new Error("Invalid passphrase options");
      }

      const words: string[] = [];
      for (let i = 0; i < options.wordCount; i++) {
        const word = pick(WORDLIST);
        if (options.capitalize) {
          words.push(word.charAt(0).toUpperCase() + word.slice(1));
        } else {
          words.push(word);
        }
      }
      return words.join(options.separator);
    }

    case "pin": {
      if (!Number.isInteger(options.length) || options.length < 4 || options.length > 12) {
        throw new Error("PIN length must be an integer between 4 and 12");
      }

      if (options.noRepeats && options.length > 10) {
        throw new Error("noRepeats requires length <= 10");
      }

      if (!options.noRepeats) {
        const digits = DIGITS.split("");
        const result: string[] = [];
        for (let i = 0; i < options.length; i++) {
          result.push(pick(digits));
        }
        return result.join("");
      }

      return shuffle(DIGITS.split(""))
        .slice(0, options.length)
        .join("");
    }

    default: {
      // Compile-time exhaustiveness check to prevent unhandled generator modes
      const _exhaustive: never = options;
      throw new Error(
        `Unsupported generator mode: ${(_exhaustive as { mode: string }).mode}`
      );
    }
  }
}
