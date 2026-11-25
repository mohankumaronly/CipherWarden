/**
 * @file DashboardPage.tsx
 * @description Main authenticated dashboard with Bitwarden-style two-pane shell, dense data table, and multi-type vault item support.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, KeyRound, Lock, Menu, Search, ShieldCheck, X } from "lucide-react";
import { VaultLayout } from "../layouts/VaultLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Dialog } from "../components/ui/Dialog";
import { Spinner } from "../components/ui/Spinner";
import { useVault } from "../contexts/VaultContext";
import { useToast } from "../components/ui/Toast";
import { CredentialFormDialog } from "../features/credentials/CredentialFormDialog";
import { CardFormDialog } from "../features/cards/CardFormDialog";
import { VaultTable } from "../features/dashboard/VaultTable";
import { NewItemMenu } from "../features/dashboard/NewItemMenu";
import type { VaultItem } from "../types";
import type { PlainVaultPayload } from "../crypto/vaultKey";

/**
 * DashboardPage is the primary screen after vault unlock, presenting
 * items filtered by category or folder in a Bitwarden-style table layout.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    credentials,
    folders,
    activeFilter,
    loadingCredentials,
    lockVault,
    addCredential,
    updateCredential,
    deleteCredential,
  } = useVault();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<VaultItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Compute title for the header based on activeFilter
  const headerTitle = useMemo(() => {
    if (activeFilter.kind === "all") return "All Items";
    if (activeFilter.kind === "favorites") return "Favorites";
    if (activeFilter.kind === "type") {
      return activeFilter.type === "LOGIN" ? "Logins" : "Cards";
    }
    if (activeFilter.kind === "folder") {
      const folder = folders.find((f) => f.id === activeFilter.folderId);
      return folder ? folder.name : "Folder";
    }
    return "Your vault";
  }, [activeFilter, folders]);

  // Filter items according to the active sidebar filter
  const visible = useMemo(() => {
    return credentials.filter((item) => {
      if (activeFilter.kind === "all") return true;
      if (activeFilter.kind === "type") return item.type === activeFilter.type;
      if (activeFilter.kind === "folder") return item.folderId === activeFilter.folderId;
      if (activeFilter.kind === "favorites") return item.isFavorite === true;
      return true;
    });
  }, [credentials, activeFilter]);

  // Search filter supporting logins and cards
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter((item) => {
      if (item.type === "LOGIN") {
        return [item.title, item.username, item.url ?? ""].some((field) =>
          field.toLowerCase().includes(q)
        );
      }
      if (item.type === "CARD") {
        return [item.title, item.cardholderName, item.cardNumber].some((field) =>
          field.toLowerCase().includes(q)
        );
      }
      return false;
    });
  }, [visible, query]);

  const openAddLogin = () => {
    setEditingItem(null);
    setLoginDialogOpen(true);
  };

  const openAddCard = () => {
    setEditingItem(null);
    setCardDialogOpen(true);
  };

  const openEdit = (item: VaultItem) => {
    setEditingItem(item);
    if (item.type === "LOGIN") {
      setLoginDialogOpen(true);
    } else if (item.type === "CARD") {
      setCardDialogOpen(true);
    }
  };

  const onLock = async () => {
    await lockVault();
    toast("Vault locked", "info");
    navigate("/unlock", { replace: true });
  };

  const handleSaveItem = async (data: PlainVaultPayload) => {
    if (editingItem) {
      await updateCredential(editingItem.id, data);
      toast(data.type === "LOGIN" ? "Login updated" : "Card updated", "success");
    } else {
      await addCredential(data);
      toast(data.type === "LOGIN" ? "Login added" : "Card added", "success");
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      await deleteCredential(deletingItem.id);
      toast("Item deleted", "success");
      setDeletingItem(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <VaultLayout sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)}>
      <div className="flex flex-col min-h-full w-full min-w-0 overflow-hidden">
        {/* Top header */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 p-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {headerTitle}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {visible.length} {visible.length === 1 ? "item" : "items"} · encrypted locally
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NewItemMenu onNewLogin={openAddLogin} onNewCard={openAddCard} />
              <Button variant="outline" size="sm" onClick={onLock}>
                <Lock className="h-4 w-4" />
                Lock vault
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search vault items…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                trailing={
                  query ? (
                    <button
                      onClick={() => setQuery("")}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Content list area */}
        <div className="flex-1 w-full min-w-0">
          {loadingCredentials ? (
            <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
              <Spinner />
              <p className="text-sm">Decrypting your vault…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="m-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-20 text-center dark:border-slate-700 dark:bg-slate-900/50">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30">
                {query ? (
                  <Search className="h-7 w-7" />
                ) : activeFilter.kind === "type" && activeFilter.type === "CARD" ? (
                  <CreditCard className="h-7 w-7" />
                ) : (
                  <KeyRound className="h-7 w-7" />
                )}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {query
                  ? "No matching items"
                  : activeFilter.kind === "folder"
                  ? "This folder is empty"
                  : activeFilter.kind === "type" && activeFilter.type === "CARD"
                  ? "No cards in this vault"
                  : credentials.length === 0
                  ? "Your vault is empty"
                  : "No items to display"}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {query
                  ? "Try a different search term."
                  : activeFilter.kind === "folder"
                  ? "Items assigned to this folder will appear here."
                  : activeFilter.kind === "type" && activeFilter.type === "CARD"
                  ? "Click New → New Card above to add your first payment card."
                  : credentials.length === 0
                  ? "Add your first item. It will be encrypted in your browser before being stored."
                  : "Change the sidebar filter to view items."}
              </p>
              {credentials.length === 0 && (
                <div className="mt-6 flex items-center gap-3">
                  <Button onClick={openAddLogin}>
                    Add your first login
                  </Button>
                  <Button variant="outline" onClick={openAddCard}>
                    Add your first card
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <VaultTable
              items={filtered}
              onEdit={openEdit}
              onDelete={setDeletingItem}
            />
          )}

          <div className="m-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            All entries are encrypted with AES-256-GCM in your browser. The server only ever sees ciphertext.
          </div>
        </div>
      </div>

      <CredentialFormDialog
        open={loginDialogOpen}
        onClose={() => {
          setLoginDialogOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        initial={editingItem?.type === "LOGIN" ? editingItem : null}
      />

      <CardFormDialog
        open={cardDialogOpen}
        onClose={() => {
          setCardDialogOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        initial={editingItem?.type === "CARD" ? editingItem : null}
      />

      <Dialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title={deletingItem?.type === "CARD" ? "Delete payment card?" : "Delete credential?"}
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingItem(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleteLoading}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You are about to permanently delete{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {deletingItem?.title}
          </span>
          . This will remove the encrypted record from the server.
        </p>
      </Dialog>
    </VaultLayout>
  );
}
