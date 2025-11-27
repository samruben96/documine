'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ComingSoonTabProps {
  title: string;
  description?: string;
}

/**
 * Placeholder component for tabs coming in Epic 3
 * Per AC-2.6.4: Agency and Billing tabs show "Coming soon"
 */
export function ComingSoonTab({ title, description }: ComingSoonTabProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-slate-100 p-4 mb-4">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Coming in Epic 3</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            This feature is planned for a future release. Stay tuned for updates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
