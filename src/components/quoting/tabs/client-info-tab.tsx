/**
 * Client Info Tab Placeholder
 * Story Q2.3: Quote Session Detail Page
 *
 * AC-Q2.3-1: Tab content area for Client Info
 * Placeholder - full implementation in Story Q3.1
 */

'use client';

import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ClientInfoTab() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Client Information</CardTitle>
        </div>
        <CardDescription>
          Personal and contact information for the prospect
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">
            Client information form coming in Story Q3.1
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
