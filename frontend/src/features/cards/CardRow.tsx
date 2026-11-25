/**
 * @file CardRow.tsx
 * @description List row item displaying an individual payment card with copy, reveal, edit and delete actions.
 */

import { useState } from "react";
import { Check, Copy, CreditCard, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import type { VaultCardItem } from "../../types";

interface CardRowProps {
  card: VaultCardItem;
  onEdit: (card: VaultCardItem) => void;
  onDelete: (card: VaultCardItem) => void;
}

/**
 * Masks a card number to show only the last 4 digits (e.g. "•••• 1234").
 */
function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\s+/g, "");
  if (digits.length <= 4) return "••••";
  const lastFour = digits.slice(-4);
  return `•••• ${lastFour}`;
}

/**
 * CardRow renders a single payment card item in a stacked or list layout.
 *
 * @param props.card - The decrypted vault card item.
 * @param props.onEdit - Callback to open the edit dialog.
 * @param props.onDelete - Callback to open the delete confirmation dialog.
 */
export function CardRow({ card, onEdit, onDelete }: CardRowProps) {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(card.cardNumber.replace(/\s+/g, ""));
      setCopied(true);
      toast("Card number copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  };

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-md sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Card Icon Container */}
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
          <CreditCard className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {card.title}
            </h3>
            {card.expiry && (
              <Badge tone="slate">
                Exp {card.expiry}
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {card.cardholderName || "Payment card"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:w-64">
        <div className="flex flex-1 items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
          <span className="flex-1 truncate font-mono text-sm text-slate-700 dark:text-slate-300">
            {revealed ? card.cardNumber : maskCardNumber(card.cardNumber)}
          </span>
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label={revealed ? "Hide card number" : "Show card number"}
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={copyCardNumber}
            className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Copy card number"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(card)}
            aria-label="Edit card"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(card)}
            aria-label="Delete card"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
