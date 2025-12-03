import { FileText, MessageSquare, Shield } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

/**
 * Auth Layout Component
 * AC-6.8.11: Enhanced auth pages with:
 * - Subtle gradient background
 * - Branded illustration/icon
 * - Value proposition text
 * - Modern card treatment with shadow
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8">
      {/* Background pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* docuMINE Logo/Header with brand accent */}
      <div className="relative mb-8 text-center">
        {/* Icon above logo */}
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          docu<span className="text-primary">MINE</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          AI-powered document analysis
        </p>
      </div>

      {/* Auth Container with card styling - AC-6.8.11 */}
      <div className="relative w-full max-w-[400px] bg-white rounded-xl border border-slate-200 shadow-lg p-6 sm:p-8">
        {children}
      </div>

      {/* Value proposition - AC-6.8.11 */}
      <div className="relative mt-8 w-full max-w-[500px]">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-slate-600 font-medium">Upload Any Document</p>
          </div>
          <div className="p-3">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-slate-600 font-medium">Ask Questions</p>
          </div>
          <div className="p-3">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-slate-600 font-medium">Secure & Private</p>
          </div>
        </div>
      </div>

      {/* Toast notifications - bottom-right per AC-2.1.6 */}
      <Toaster position="bottom-right" />
    </div>
  );
}
