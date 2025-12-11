import { Calculator } from 'lucide-react';

/**
 * Quoting Page
 * Story DR.2 Task 6: Placeholder page for Quoting feature
 * Links from the sidebar navigation
 */
export default function QuotingPage() {
  return (
    <div className="h-full overflow-auto">
      {/* Story DR.3: AC-DR.3.2, AC-DR.3.3 - max-w-5xl mx-auto p-6 */}
      <div className="max-w-5xl mx-auto p-6 view-fade-in">
        {/* Coming Soon Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
            <Calculator className="w-8 h-8 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Quoting Helper
          </h1>
          <p className="text-lg text-primary font-medium mb-4">Coming Soon</p>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
            Enter client data once and copy it to any carrier portal. Compare quotes
            side-by-side and generate professional comparison documents for your clients.
          </p>

          {/* Features List */}
          <div className="text-left max-w-sm mx-auto space-y-3">
            <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wide mb-3">
              What to expect
            </h3>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-400 text-xs">1</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Enter client information once in a smart form
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-400 text-xs">2</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Copy data formatted for each carrier with one click
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-400 text-xs">3</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Enter quotes received and compare side-by-side
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-400 text-xs">4</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Generate professional comparison PDF for clients
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
