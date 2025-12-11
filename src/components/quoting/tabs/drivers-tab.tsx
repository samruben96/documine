/**
 * Drivers Tab Placeholder
 * Story Q2.3: Quote Session Detail Page
 *
 * AC-Q2.3-1: Tab content area for Drivers
 * AC-Q2.3-4: Hidden for Home-only quotes
 * Placeholder - full implementation in Story Q3.5
 */

'use client';

import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DriversTab() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Drivers</CardTitle>
        </div>
        <CardDescription>
          Drivers to be included in the auto insurance quote
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">
            Driver management coming in Story Q3.5
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
