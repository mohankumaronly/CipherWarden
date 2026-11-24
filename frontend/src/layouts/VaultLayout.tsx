/**
 * @file VaultLayout.tsx
 * @description Master Bitwarden-style shell layout with persistent sidebar and scrollable main view.
 */

import type { ReactNode } from "react";
import { AppLayout } from "./AppLayout";
import { Sidebar } from "../features/dashboard/Sidebar";

interface VaultLayoutProps {
  children: ReactNode;
}

export function VaultLayout({ children }: VaultLayoutProps) {
  return (
    <AppLayout bare>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AppLayout>
  );
}
