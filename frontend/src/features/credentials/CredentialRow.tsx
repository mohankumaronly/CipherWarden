/**
 * @file CredentialRow.tsx
 * @description List item displaying an individual login credential with proxied favicon and letter avatar fallback.
 */

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import type { VaultLoginItem } from "../../types";
import { avatarColor, formatRelativeTime, initials } from "../../utils/format";

interface CredentialRowProps {
  credential: VaultLoginItem;
  onEdit: (credential: VaultLoginItem) => void;
  onDelete: (credential: VaultLoginItem) => void;
}

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
 * Base API URL for backend proxy requests. Trim trailing slashes to prevent double slashes.
 */
const API_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

/**
 * CredentialRow renders a single login credential item with an absolute-URL proxied
 * favicon (using crossOrigin="anonymous" to comply with backend Helmet CORS/CORP headers)
 * and falls back to a colored monogram avatar on 404 or network failure.
 *
 * @param props.credential - Decrypted login vault item.
 * @param props.onEdit - Callback to open edit modal.
 * @param props.onDelete - Callback to open delete confirmation modal.
 */
export function CredentialRow({ credential, onEdit, onDelete }: CredentialRowProps) {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failedDomain, setFailedDomain] = useState<string | null>(null);

  const domain = getDomain(credential.url);
  const showFavicon = Boolean(domain && failedDomain !== domain);

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(credential.password);
      setCopied(true);
      toast("Password copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  };

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-md sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Favicon / Letter Avatar */}
        {showFavicon && domain ? (
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1.5 shadow-xs dark:border-slate-700 dark:bg-slate-800">
            <img
              src={`${API_BASE}/favicon?domain=${encodeURIComponent(domain)}`}
              alt={credential.title}
              className="h-full w-full object-contain"
              crossOrigin="anonymous"
              onError={() => setFailedDomain(domain)}
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white ${avatarColor(credential.id)}`}
          >
            {initials(credential.title)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {credential.title}
            </h3>
            {credential.url && (
              <a
                href={credential.url.startsWith("http") ? credential.url : `https://${credential.url}`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 transition-colors hover:text-brand-600"
                aria-label="Open website"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {credential.username || "No username"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:w-64">
        <div className="flex flex-1 items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
          <span className="flex-1 truncate font-mono text-sm text-slate-700 dark:text-slate-300">
            {revealed ? credential.password : "••••••••••"}
          </span>
          <button
            onClick={() => setRevealed((v) => !v)}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={copyPassword}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Copy password"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        <Badge tone="slate" className="hidden shrink-0 md:inline-flex">
          {formatRelativeTime(credential.updatedAt)}
        </Badge>
        <div className="flex gap-1 ml-auto">
          <Button variant="ghost" size="icon" onClick={() => onEdit(credential)} aria-label="Edit credential">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(credential)}
            aria-label="Delete credential"
            className="text-slate-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
