/**
 * Results Tab Placeholder
 * Story Q2.3: Quote Session Detail Page
 *
 * AC-Q2.3-1: Tab content area for Results
 * Placeholder - full implementation in Story Q5.2
 */

'use client';

import { FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ResultsTab() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Quote Results</CardTitle>
        </div>
        <CardDescription>
          View and compare quote results from carriers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">
            Quote results management coming in Story Q5.2
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
