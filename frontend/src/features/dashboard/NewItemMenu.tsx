/**
 * @file NewItemMenu.tsx
 * @description Dropdown action button to trigger creation of new Login or Card vault items.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, CreditCard, KeyRound } from "lucide-react";
import { Button } from "../../components/ui/Button";

interface NewItemMenuProps {
  onNewLogin: () => void;
}

export function NewItemMenu({ onNewLogin }: NewItemMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className="gap-1.5"
      >
        <span>New</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-fade-in dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => {
              setOpen(false);
              onNewLogin();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            role="menuitem"
          >
            <KeyRound className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>New Login</span>
          </button>

          <button
            disabled
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-600 cursor-not-allowed"
            role="menuitem"
            title="Card management coming in Phase 6.3"
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4" />
              <span>New Card</span>
            </div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Soon
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
