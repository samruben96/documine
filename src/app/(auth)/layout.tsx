import { Toaster } from '@/components/ui/sonner';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
      {/* docuMINE Logo/Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-700 tracking-tight">
          docu<span className="text-slate-500">MINE</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          AI-powered document analysis
        </p>
      </div>

      {/* Auth Container - max-width 400px per UX spec */}
      <div className="w-full max-w-[400px]">
        {children}
      </div>

      {/* Toast notifications - bottom-right per AC-2.1.6 */}
      <Toaster position="bottom-right" />
    </div>
  );
}
