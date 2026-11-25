/**
 * @file QuickFolderMenu.tsx
 * @description Dropdown popover menu to quickly assign or reassign a vault item to an organizational folder.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Folder, FolderInput } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useVault } from "../../contexts/VaultContext";
import { useToast } from "../../components/ui/Toast";

interface QuickFolderMenuProps {
  itemId: string;
  currentFolderId: string | null;
}

/**
 * QuickFolderMenu displays a folder icon button that triggers a dropdown menu
 * containing all available folders, enabling one-click folder reassignment.
 *
 * @param props.itemId - UUID of the vault item to reassign.
 * @param props.currentFolderId - ID of the folder the item is currently assigned to (or null).
 */
export function QuickFolderMenu({ itemId, currentFolderId }: QuickFolderMenuProps) {
  const { folders, assignFolder } = useVault();
  const { toast } = useToast();
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

  const handleSelect = async (folderId: string | null) => {
    setOpen(false);
    if (folderId === currentFolderId) return;
    try {
      await assignFolder(itemId, folderId);
      const target = folders.find((f) => f.id === folderId);
      toast(target ? `Assigned to "${target.name}"` : "Removed from folder", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to assign folder", "error");
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Assign folder"
        title="Assign folder"
      >
        <FolderInput className="h-4 w-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-fade-in dark:border-slate-800 dark:bg-slate-900">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Assign Folder
          </p>

          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <span className="truncate">No folder</span>
            {currentFolderId === null && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />}
          </button>

          {folders.length > 0 && <div className="my-1 border-t border-slate-100 dark:border-slate-800" />}

          {folders.map((folder) => {
            const isSelected = currentFolderId === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleSelect(folder.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
