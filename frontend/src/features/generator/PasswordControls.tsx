/**
 * Component rendering configuration controls for password generation mode.
 */

import type { ChangeEvent, FocusEvent } from "react";
import type { PasswordOptions } from "./types.ts";
import { Badge } from "../../components/ui/Badge.tsx";

export interface PasswordControlsProps {
  options: PasswordOptions;
  onChange: (patch: Partial<PasswordOptions>) => void;
}

/**
 * Counts how many character classes are currently enabled.
 */
function countSelectedClasses(opts: PasswordOptions): number {
  let count = 0;
  if (opts.includeLowercase) count++;
  if (opts.includeUppercase) count++;
  if (opts.includeDigits) count++;
  if (opts.includeSymbols) count++;
  return count;
}

/**
 * Renders length and character set selection controls for passwords.
 */
export function PasswordControls({ options, onChange }: PasswordControlsProps) {
  const selectedCount = countSelectedClasses(options);

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ length: parseInt(e.target.value, 10) });
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!Number.isNaN(val)) {
      onChange({ length: val });
    }
  };

  const handleNumberBlur = (e: FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (Number.isNaN(val)) {
      onChange({ length: options.length });
    } else {
      const clamped = Math.min(64, Math.max(8, Math.round(val)));
      onChange({ length: clamped });
    }
  };

  let validationError: string | null = null;
  if (selectedCount === 0) {
    validationError = "At least one character class must be selected";
  } else if (options.length < selectedCount) {
    validationError = "Length too short for selected character classes";
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="password-length-slider"
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Password length
          </label>
          <div className="flex items-center gap-2">
            <Badge tone="brand">{options.length}</Badge>
            <input
              id="password-length-number"
              type="number"
              min={8}
              max={64}
              value={options.length}
              onChange={handleNumberChange}
              onBlur={handleNumberBlur}
              aria-label="Password length input"
              className="h-8 w-16 rounded-md border border-slate-300 bg-white px-2 text-center text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <input
          id="password-length-slider"
          type="range"
          min={8}
          max={64}
          value={options.length}
          onChange={handleSliderChange}
          aria-label="Password length slider"
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-brand-600 dark:bg-slate-700 dark:accent-brand-500"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      <div className="space-y-2.5">
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Character sets
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
            <input
              type="checkbox"
              checked={options.includeLowercase}
              onChange={() => onChange({ includeLowercase: !options.includeLowercase })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Lowercase (a-z)</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
            <input
              type="checkbox"
              checked={options.includeUppercase}
              onChange={() => onChange({ includeUppercase: !options.includeUppercase })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Uppercase (A-Z)</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
            <input
              type="checkbox"
              checked={options.includeDigits}
              onChange={() => onChange({ includeDigits: !options.includeDigits })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Digits (0-9)</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
            <input
              type="checkbox"
              checked={options.includeSymbols}
              onChange={() => onChange({ includeSymbols: !options.includeSymbols })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Symbols (!@#$…)</span>
          </label>
        </div>
      </div>

      <div className="pt-1">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={options.avoidAmbiguous}
            onChange={() => onChange({ avoidAmbiguous: !options.avoidAmbiguous })}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
          />
          <div>
            <span className="block text-sm text-slate-700 dark:text-slate-300">
              Avoid ambiguous characters
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Excludes I l 1 O 0 o
            </span>
          </div>
        </label>
      </div>

      {validationError && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
}
