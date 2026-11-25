/**
 * @file QuickFolderMenu.tsx
 * @description Dropdown popover menu to quickly assign or reassign a vault item to an organizational folder.
 * Rendered via React Portal into document.body to prevent table overflow-hidden clipping.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Folder, FolderInput } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useVault } from "../../contexts/VaultContext";
import { useToast } from "../../components/ui/Toast";

interface QuickFolderMenuProps {
  itemId: string;
  currentFolderId: string | null;
}

/**
 * QuickFolderMenu displays a folder icon button that triggers a portal-rendered
 * dropdown menu containing all available folders, preventing clipping from table overflow.
 *
 * @param props.itemId - UUID of the vault item to reassign.
 * @param props.currentFolderId - ID of the folder the item is currently assigned to (or null).
 */
export function QuickFolderMenu({ itemId, currentFolderId }: QuickFolderMenuProps) {
  const { folders, assignFolder } = useVault();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (!open) {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        // Position menu below the button, or above if near bottom
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow < 200
          ? rect.top - 180 // open upward
          : rect.bottom + 4; // open downward
        setCoords({
          top: Math.max(8, top),
          left: Math.max(8, Math.min(window.innerWidth - 200, rect.left - 100)),
        });
      }
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
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
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Assign folder"
        title="Assign folder"
      >
        <FolderInput className="h-4 w-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" />
      </Button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="fixed z-50 w-48 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg animate-fade-in dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Assign Folder
            </p>

            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors text-left"
            >
              <span className="truncate">No folder</span>
              {currentFolderId === null && (
                <Check className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
              )}
            </button>

            {folders.length > 0 && (
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            )}

            {folders.map((folder) => {
              const isSelected = currentFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleSelect(folder.id)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
