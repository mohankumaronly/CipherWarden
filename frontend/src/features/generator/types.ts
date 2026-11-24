/**
 * Types and interfaces for the password generator feature.
 */

export type GeneratorMode = "password" | "passphrase" | "pin";

export interface PasswordOptions {
  mode: "password";
  length: number; // 8-64 inclusive
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
  avoidAmbiguous: boolean;
}

export interface PassphraseOptions {
  mode: "passphrase";
  wordCount: number; // 3-10 inclusive
  separator: "-" | "_" | "." | " ";
  capitalize: boolean;
}

export interface PinOptions {
  mode: "pin";
  length: number; // 4-12 inclusive
  noRepeats: boolean;
}

export type GeneratorOptions =
  | PasswordOptions
  | PassphraseOptions
  | PinOptions;
