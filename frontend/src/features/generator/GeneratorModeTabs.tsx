/**
 * Component rendering mode selector tabs (password, passphrase, pin).
 */

import { BookText, Hash, KeyRound } from "lucide-react";
import type { GeneratorMode } from "./types.ts";
import { cn } from "../../utils/cn.ts";

export interface GeneratorModeTabsProps {
  mode: GeneratorMode;
  onChange: (mode: GeneratorMode) => void;
}

interface TabDefinition {
  id: GeneratorMode;
  label: string;
  icon: typeof KeyRound;
}

const TABS: readonly TabDefinition[] = [
  { id: "password", label: "Password", icon: KeyRound },
  { id: "passphrase", label: "Passphrase", icon: BookText },
  { id: "pin", label: "PIN", icon: Hash },
];

/**
 * Renders tab list for selecting password generator modes.
 */
export function GeneratorModeTabs({ mode, onChange }: GeneratorModeTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Generator mode"
      className="flex w-full rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const selected = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              selected
                ? "bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
