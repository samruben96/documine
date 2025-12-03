'use client';

import { Header } from '@/components/layout/header';
import { SidebarProvider } from '@/components/layout/sidebar';
import { ChatDockProvider } from '@/components/layout/split-view';

/**
 * Dashboard Layout
 * Per AC-2.4.3: Protected routes layout with header
 * Middleware handles auth redirect; this provides consistent UI shell
 *
 * Updated for AC-4.3.7: Supports full-height layouts for split view
 * Updated for AC-6.8.10: SidebarProvider for mobile sheet
 * Updated for AC-6.8.17: ChatDockProvider for dockable chat panel
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ChatDockProvider>
        <div className="h-screen flex flex-col bg-slate-50">
          <Header />
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </ChatDockProvider>
    </SidebarProvider>
  );
}
