import { Header } from '@/components/layout/header';

/**
 * Dashboard Layout
 * Per AC-2.4.3: Protected routes layout with header
 * Middleware handles auth redirect; this provides consistent UI shell
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
