import { Header } from '@/components/layout/header';

/**
 * Dashboard Layout
 * Per AC-2.4.3: Protected routes layout with header
 * Middleware handles auth redirect; this provides consistent UI shell
 *
 * Updated for AC-4.3.7: Supports full-height layouts for split view
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
