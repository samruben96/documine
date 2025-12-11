/**
 * Carriers Tab Placeholder
 * Story Q2.3: Quote Session Detail Page
 *
 * AC-Q2.3-1: Tab content area for Carriers
 * Placeholder - full implementation in Story Q4.3
 */

'use client';

import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CarriersTab() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Carriers</CardTitle>
        </div>
        <CardDescription>
          Copy formatted client data to carrier portals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">
            Carrier copy system coming in Story Q4.3
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
