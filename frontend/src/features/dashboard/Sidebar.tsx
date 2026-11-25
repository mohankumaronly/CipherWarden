/**
 * @file Sidebar.tsx
 * @description Bitwarden-style navigation sidebar for filtering vault items and managing folders.
 */

import { useState, type FormEvent } from "react";
import {
  CreditCard,
  Folder as FolderIcon,
  FolderPlus,
  KeyRound,
  Layers,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Logo } from "../../components/ui/Logo";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { useVault } from "../../contexts/VaultContext";
import type { VaultFolder, VaultFilter } from "../../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {
    credentials,
    folders,
    activeFilter,
    setActiveFilter,
    createFolder,
    deleteFolder,
  } = useVault();
  const { toast } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<VaultFolder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalLogins = credentials.filter((c) => c.type === "LOGIN").length;
  const totalCards = credentials.filter((c) => c.type === "CARD").length;

  const handleSelectFilter = (filter: VaultFilter) => {
    setActiveFilter(filter);
    onClose();
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const created = await createFolder(trimmed);
      toast(`Folder "${created.name}" created`, "success");
      setFolderName("");
      setCreateModalOpen(false);
      handleSelectFilter({ kind: "folder", folderId: created.id });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create folder", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingFolder) return;
    setDeleting(true);
    try {
      await deleteFolder(deletingFolder.id);
      toast(`Folder "${deletingFolder.name}" deleted`, "success");
      setDeletingFolder(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete folder", "error");
    } finally {
      setDeleting(false);
    }
  };

  const navItemClass = (isActive: boolean) =>
    `group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar drawer / static column */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top branding */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main filters */}
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Vault
          </p>
          <div className="mt-2 space-y-1">
            <button
              onClick={() => handleSelectFilter({ kind: "all" })}
              className={navItemClass(activeFilter.kind === "all")}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4" />
                <span>All Items</span>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {credentials.length}
              </span>
            </button>

            <button
              onClick={() => handleSelectFilter({ kind: "favorites" })}
              className={navItemClass(activeFilter.kind === "favorites")}
            >
              <div className="flex items-center gap-2.5">
                <Star className="h-4 w-4" />
                <span>Favorites</span>
              </div>
              <span className="text-xs text-slate-400">0</span>
            </button>
          </div>
        </div>

        {/* Item Types */}
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Types
          </p>
          <div className="mt-2 space-y-1">
            <button
              onClick={() => handleSelectFilter({ kind: "type", type: "LOGIN" })}
              className={navItemClass(
                activeFilter.kind === "type" && activeFilter.type === "LOGIN"
              )}
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-4 w-4" />
                <span>Login</span>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {totalLogins}
              </span>
            </button>

            <button
              onClick={() => handleSelectFilter({ kind: "type", type: "CARD" })}
              className={navItemClass(
                activeFilter.kind === "type" && activeFilter.type === "CARD"
              )}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4" />
                <span>Card</span>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {totalCards}
              </span>
            </button>
          </div>
        </div>

        {/* Folders */}
        <div>
          <div className="flex items-center justify-between px-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Folders
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              title="Add folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {folders.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400 italic">No folders yet</p>
            ) : (
              folders.map((folder) => {
                const count = credentials.filter((c) => c.folderId === folder.id).length;
                const isActive =
                  activeFilter.kind === "folder" && activeFilter.folderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <button
                      onClick={() =>
                        handleSelectFilter({ kind: "folder", folderId: folder.id })
                      }
                      className="flex flex-1 items-center gap-2.5 truncate text-left"
                    >
                      <FolderIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </button>
                    <div className="flex items-center gap-1.5 pl-2">
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {count}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingFolder(folder);
                        }}
                        aria-label={`Delete ${folder.name}`}
                        className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600 dark:hover:bg-slate-700 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-brand-400 transition-colors mt-2"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>+ New Folder</span>
            </button>
          </div>
        </div>
      </div>
    </aside>

      {/* New Folder Modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="New folder"
        description="Organize your credentials and cards into custom folders."
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCreateModalOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-folder-form"
              loading={creating}
              disabled={!folderName.trim()}
            >
              Create folder
            </Button>
          </>
        }
      >
        <form id="create-folder-form" onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Folder name"
            placeholder="e.g. Work, Finance, Social"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            autoFocus
            required
          />
        </form>
      </Dialog>

      {/* Delete Folder Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingFolder)}
        onClose={() => setDeletingFolder(null)}
        title="Delete folder?"
        description="Vault items inside this folder will remain in your vault, unassigned."
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingFolder(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete folder{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            "{deletingFolder?.name}"
          </span>
          ?
        </p>
      </Dialog>
    </>
  );
}
