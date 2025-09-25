
'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

export function Providers({ 
  children,
  session 
}: {
  children: React.ReactNode;
  session?: any;
}) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}
