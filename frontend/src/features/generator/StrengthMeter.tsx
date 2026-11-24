/**
 * Component rendering password strength visualization bar and score label.
 */

import { evaluatePasswordStrength } from "../../utils/passwordStrength.ts";
import { cn } from "../../utils/cn.ts";

export interface StrengthMeterProps {
  password: string;
}

/**
 * Visual strength meter displaying 5-segment bar and qualitative label.
 */
export function StrengthMeter({ password }: StrengthMeterProps) {
  if (!password) {
    return (
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={0}
        aria-label="Password strength"
        className="space-y-1.5"
      >
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((segIndex) => (
            <div
              key={segIndex}
              className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700"
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Generate a password to see strength
        </p>
      </div>
    );
  }

  const strength = evaluatePasswordStrength(password);

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={strength.score}
      aria-label="Password strength"
      className="space-y-1.5"
    >
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((segIndex) => {
          const isFilled = segIndex <= strength.score;
          return (
            <div
              key={segIndex}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                isFilled ? strength.color : "bg-slate-200 dark:bg-slate-700"
              )}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Strength: {strength.label}
        </span>
      </div>
    </div>
  );
}
