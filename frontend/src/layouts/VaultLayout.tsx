/**
 * @file VaultLayout.tsx
 * @description Master Bitwarden-style shell layout with responsive sidebar and scrollable main view.
 */

import { useState, type ReactNode } from "react";
import { AppLayout } from "./AppLayout";
import { Sidebar } from "../features/dashboard/Sidebar";

interface VaultLayoutProps {
  children: ReactNode;
  sidebarOpen?: boolean;
  onCloseSidebar?: () => void;
}

export function VaultLayout({
  children,
  sidebarOpen: externalOpen,
  onCloseSidebar,
}: VaultLayoutProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const onClose = onCloseSidebar ?? (() => setInternalOpen(false));

  return (
    <AppLayout bare>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar isOpen={isOpen} onClose={onClose} />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </AppLayout>
  );
}
