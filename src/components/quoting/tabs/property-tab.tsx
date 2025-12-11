/**
 * Property Tab Placeholder
 * Story Q2.3: Quote Session Detail Page
 *
 * AC-Q2.3-1: Tab content area for Property
 * AC-Q2.3-3: Hidden for Auto-only quotes
 * Placeholder - full implementation in Story Q3.3
 */

'use client';

import { Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PropertyTab() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Property Information</CardTitle>
        </div>
        <CardDescription>
          Address and details about the insured property
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">
            Property information form coming in Story Q3.3
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
