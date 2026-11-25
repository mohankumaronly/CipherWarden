/**
 * @file CardFormDialog.tsx
 * @description Dialog modal for creating and updating encrypted Card items.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input, PasswordInput } from "../../components/ui/Input";
import { useVault } from "../../contexts/VaultContext";
import type { PlainVaultPayload } from "../../crypto/vaultKey";
import type { VaultCardItem } from "../../types";

interface CardFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PlainVaultPayload) => Promise<void>;
  initial?: VaultCardItem | null;
}

interface CardFormState {
  title: string;
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  notes: string;
  folderId: string;
}

const emptyCardState: CardFormState = {
  title: "",
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  notes: "",
  folderId: "",
};

/**
 * Formats a card number with spaces every 4 digits for display.
 */
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/**
 * Formats an expiry date string to MM/YY pattern.
 */
function formatExpiry(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
  }
  return clean;
}

/**
 * CardFormDialog renders an encrypted modal form for payment card items.
 *
 * @param props.open - Whether the dialog is visible.
 * @param props.onClose - Callback invoked when the modal is dismissed.
 * @param props.onSubmit - Async callback receiving the encrypted payload.
 * @param props.initial - Existing card record to pre-populate when editing.
 */
export function CardFormDialog({ open, onClose, onSubmit, initial }: CardFormDialogProps) {
  const { folders, activeFilter } = useVault();
  const [form, setForm] = useState<CardFormState>(emptyCardState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        cardholderName: initial.cardholderName,
        cardNumber: initial.cardNumber,
        expiry: initial.expiry,
        cvv: initial.cvv,
        notes: initial.notes ?? "",
        folderId: initial.folderId ?? "",
      });
    } else {
      setForm({
        ...emptyCardState,
        folderId: activeFilter.kind === "folder" ? activeFilter.folderId : "",
      });
    }
    setError(null);
  }, [open, initial, activeFilter]);

  const updateField = (key: keyof CardFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    let value = e.target.value;
    if (key === "cardNumber") {
      value = formatCardNumber(value);
    } else if (key === "expiry") {
      value = formatExpiry(value);
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = form.title.trim().length > 0 && form.cardNumber.trim().length > 0 && !saving;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        type: "CARD",
        title: form.title.trim(),
        cardholderName: form.cardholderName.trim(),
        cardNumber: form.cardNumber.trim(),
        expiry: form.expiry.trim(),
        cvv: form.cvv.trim(),
        notes: form.notes.trim() || undefined,
        folderId: form.folderId || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "Edit payment card" : "Add payment card"}
      description={initial ? "Update your encrypted card details." : "Your card details are encrypted in your browser before saving."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="card-form" loading={saving} disabled={!canSubmit}>
            {initial ? "Save changes" : "Add card"}
          </Button>
        </>
      }
    >
      <form
        id="card-form"
        onSubmit={handleSubmit}
        className="space-y-4 overflow-y-auto max-h-[calc(100vh-16rem)] pr-1"
      >
        <Input
          label="Card Name (Title)"
          placeholder="e.g. Personal Visa, Work Amex"
          value={form.title}
          onChange={updateField("title")}
          autoFocus
          required
        />
        <Input
          label="Cardholder Name"
          placeholder="Name on card"
          value={form.cardholderName}
          onChange={updateField("cardholderName")}
        />
        <Input
          label="Card Number"
          placeholder="4111 2222 3333 4444"
          value={form.cardNumber}
          onChange={updateField("cardNumber")}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Expiration Date"
            placeholder="MM/YY"
            value={form.expiry}
            onChange={updateField("expiry")}
            maxLength={5}
          />
          <PasswordInput
            label="Security Code (CVV)"
            placeholder="123"
            value={form.cvv}
            onChange={updateField("cvv")}
            maxLength={4}
          />
        </div>

        {folders.length > 0 && (
          <div>
            <label htmlFor="card-folder" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Folder
            </label>
            <select
              id="card-folder"
              value={form.folderId}
              onChange={updateField("folderId")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">(No folder)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="card-notes" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Notes
          </label>
          <textarea
            id="card-notes"
            value={form.notes}
            onChange={updateField("notes")}
            rows={3}
            placeholder="Optional notes or billing address…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
      </form>
    </Dialog>
  );
}
