import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Branding Tab Skeleton Component
 * Story 22.1: AC-22.1.1 - Shows skeleton shimmer while branding data loads
 * Matches structure of BrandingForm (logo, colors, contact info)
 */
export function BrandingTabSkeleton() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Agency Branding</CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-72" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Logo Upload Section */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-20" />
          <div className="flex items-start gap-4">
            <Skeleton className="h-24 w-24 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          {/* Color Preview */}
          <div className="rounded-lg border border-slate-200 p-4">
            <Skeleton className="h-3 w-12 mb-2" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-28 rounded" />
              <Skeleton className="h-10 w-32 rounded" />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
