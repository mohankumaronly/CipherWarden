/**
 * Component rendering configuration controls for PIN generation mode.
 */

import type { ChangeEvent } from "react";
import type { PinOptions } from "./types.ts";
import { Badge } from "../../components/ui/Badge.tsx";

export interface PinControlsProps {
  options: PinOptions;
  onChange: (patch: Partial<PinOptions>) => void;
}

/**
 * Renders length slider and duplicate restriction toggles for PIN generation.
 */
export function PinControls({ options, onChange }: PinControlsProps) {
  const maxLen = options.noRepeats ? 10 : 12;

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ length: parseInt(e.target.value, 10) });
  };

  const handleNoRepeatsChange = () => {
    const nextNoRepeats = !options.noRepeats;
    if (nextNoRepeats && options.length > 10) {
      onChange({ noRepeats: true, length: 10 });
    } else {
      onChange({ noRepeats: nextNoRepeats });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="pin-length-slider"
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            PIN length
          </label>
          <Badge tone="brand">{options.length} digits</Badge>
        </div>
        <input
          id="pin-length-slider"
          type="range"
          min={4}
          max={maxLen}
          value={options.length}
          onChange={handleSliderChange}
          aria-label="PIN length slider"
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-brand-600 dark:bg-slate-700 dark:accent-brand-500"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>4</span>
          <span>{maxLen}</span>
        </div>
        {options.noRepeats && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Maximum 10 with no repeats
          </p>
        )}
      </div>

      <div className="pt-1">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={options.noRepeats}
            onChange={handleNoRepeatsChange}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            No repeating digits
          </span>
        </label>
      </div>
    </div>
  );
}
