/**
 * @file VaultTable.tsx
 * @description Dense Bitwarden-style data table for vault items (Logins and Cards) with responsive stacked list fallback on mobile.
 */

import { useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { useVault } from "../../contexts/VaultContext";
import { CredentialRow } from "../credentials/CredentialRow";
import { CardRow } from "../cards/CardRow";
import { QuickFolderMenu } from "./QuickFolderMenu";
import type { VaultItem, VaultLoginItem, VaultCardItem } from "../../types";
import { avatarColor, formatRelativeTime, initials } from "../../utils/format";

interface VaultTableProps {
  items: VaultItem[];
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
}

const API_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

/**
 * Safely extracts the hostname/domain from a URL string.
 */
function getDomain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
}

/**
 * Renders an avatar or favicon for a vault item inside the data table.
 */
function TableItemAvatar({ item }: { item: VaultItem }) {
  const [failed, setFailed] = useState(false);

  if (item.type === "CARD") {
    return (
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-2xs dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CreditCard className="h-4 w-4" />
      </div>
    );
  }

  const domain = getDomain(item.url);
  if (domain && !failed) {
    return (
      <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
        <img
          src={`${API_BASE}/favicon?domain=${encodeURIComponent(domain)}`}
          alt={item.title}
          className="h-full w-full object-contain"
          crossOrigin="anonymous"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white shadow-2xs ${avatarColor(item.id)}`}
    >
      {initials(item.title)}
    </div>
  );
}

/**
 * VaultTable renders a dense data table of logins and cards for desktop screens,
 * falling back to individual stacked rows on mobile displays.
 *
 * @param props.items - List of decrypted vault items to display.
 * @param props.onEdit - Callback invoked when an item is selected for editing.
 * @param props.onDelete - Callback invoked when an item is selected for deletion.
 */
export function VaultTable({ items, onEdit, onDelete }: VaultTableProps) {
  const { toggleFavorite } = useVault();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copySecret = async (item: VaultItem) => {
    const textToCopy = item.type === "LOGIN" ? item.password : item.cardNumber.replace(/\s+/g, "");
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(item.id);
      toast(item.type === "LOGIN" ? "Password copied" : "Card number copied", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  };

  return (
    <div>
      {/* Desktop Data Table */}
      <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
          <thead className="bg-slate-50/75 dark:bg-slate-950/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Username / Owner
              </th>
              <th scope="col" className="w-28 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Updated
              </th>
              <th scope="col" className="w-48 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {items.map((item) => {
              const isLogin = item.type === "LOGIN";
              const primarySubtitle = isLogin ? item.username : item.cardholderName || "Payment card";
              const isCopied = copiedId === item.id;

              return (
                <tr
                  key={item.id}
                  className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                >
                  {/* Name Column */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <TableItemAvatar item={item} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                          {!isLogin && (
                            <Badge tone="slate">
                              Card
                            </Badge>
                          )}
                          {isLogin && item.url && (
                            <a
                              href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-brand-600 transition-colors"
                              aria-label="Open website"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {isLogin && item.url && (
                          <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                            {getDomain(item.url)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Username / Owner Column */}
                  <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                    <span className="truncate block max-w-xs">
                      {primarySubtitle || "—"}
                    </span>
                  </td>

                  {/* Updated Column */}
                  <td className="w-28 px-4 py-3.5 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {formatRelativeTime(item.updatedAt)}
                  </td>

                  {/* Actions Column */}
                  <td className="w-48 px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(item.id, !item.isFavorite)}
                        aria-label={item.isFavorite ? "Unfavorite item" : "Favorite item"}
                        title={item.isFavorite ? "Unfavorite item" : "Favorite item"}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            item.isFavorite
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-slate-400 hover:text-yellow-500"
                          }`}
                        />
                      </Button>
                      <QuickFolderMenu itemId={item.id} currentFolderId={item.folderId} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copySecret(item)}
                        aria-label={isLogin ? "Copy password" : "Copy card number"}
                        title={isLogin ? "Copy password" : "Copy card number"}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        aria-label="Edit item"
                        title="Edit item"
                      >
                        <Pencil className="h-4 w-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                        aria-label="Delete item"
                        title="Delete item"
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked List Fallback */}
      <div className="md:hidden space-y-3">
        {items.map((item) =>
          item.type === "LOGIN" ? (
            <CredentialRow
              key={item.id}
              credential={item as VaultLoginItem}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          ) : (
            <CardRow
              key={item.id}
              card={item as VaultCardItem}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          )
        )}
      </div>
    </div>
  );
}
