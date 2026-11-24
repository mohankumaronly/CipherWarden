/**
 * Default preset options and character sets for password generation.
 */

import type {
  PasswordOptions,
  PassphraseOptions,
  PinOptions,
} from "./types.ts";

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  mode: "password",
  length: 20,
  includeLowercase: true,
  includeUppercase: true,
  includeDigits: true,
  includeSymbols: true,
  avoidAmbiguous: false,
};

export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseOptions = {
  mode: "passphrase",
  wordCount: 4,
  separator: "-",
  capitalize: false,
};

export const DEFAULT_PIN_OPTIONS: PinOptions = {
  mode: "pin",
  length: 6,
  noRepeats: false,
};

export const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
export const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const DIGITS = "0123456789";
export const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?/|";
export const AMBIGUOUS = "Il1O0o";
