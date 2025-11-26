'use client';

import { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { logout } from '@/app/(auth)/login/actions';

export default function DocumentsPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Documents</h1>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Logout
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-8 text-center text-slate-500">
        <p>Documents page placeholder</p>
        <p className="text-sm mt-2">You are authenticated!</p>
      </div>
    </div>
  );
}
