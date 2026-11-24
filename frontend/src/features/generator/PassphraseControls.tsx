/**
 * Component rendering configuration controls for passphrase generation mode.
 */

import type { ChangeEvent } from "react";
import type { PassphraseOptions } from "./types.ts";
import { Badge } from "../../components/ui/Badge.tsx";
import { cn } from "../../utils/cn.ts";

export interface PassphraseControlsProps {
  options: PassphraseOptions;
  onChange: (patch: Partial<PassphraseOptions>) => void;
}

const SEPARATORS: readonly { value: PassphraseOptions["separator"]; label: string }[] = [
  { value: "-", label: "Hyphen (-)" },
  { value: "_", label: "Underscore (_)" },
  { value: ".", label: "Period (.)" },
  { value: " ", label: "Space ( )" },
];

/**
 * Renders word count, separator, and capitalization controls for passphrases.
 */
export function PassphraseControls({ options, onChange }: PassphraseControlsProps) {
  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ wordCount: parseInt(e.target.value, 10) });
  };

  const preview = options.capitalize
    ? `Word${options.separator}Word${options.separator}Word`
    : `word${options.separator}word${options.separator}word`;

  const entropy = (options.wordCount * 10.34).toFixed(1);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="passphrase-word-count-slider"
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Number of words
          </label>
          <Badge tone="brand">{options.wordCount} words</Badge>
        </div>
        <input
          id="passphrase-word-count-slider"
          type="range"
          min={3}
          max={10}
          value={options.wordCount}
          onChange={handleSliderChange}
          aria-label="Passphrase word count slider"
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-brand-600 dark:bg-slate-700 dark:accent-brand-500"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>3</span>
          <span>10</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Word separator
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SEPARATORS.map((sep) => {
            const isSelected = options.separator === sep.value;
            return (
              <button
                key={sep.value}
                type="button"
                onClick={() => onChange({ separator: sep.value })}
                className={cn(
                  "flex items-center justify-center rounded-lg border py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  isSelected
                    ? "border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-300"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {sep.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Preview: <span className="font-mono text-slate-700 dark:text-slate-300">{preview}</span>
        </p>
      </div>

      <div className="pt-1">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={options.capitalize}
            onChange={() => onChange({ capitalize: !options.capitalize })}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Capitalize each word
          </span>
        </label>
      </div>

      <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
        ≈ {entropy} bits of entropy
      </div>
    </div>
  );
}
