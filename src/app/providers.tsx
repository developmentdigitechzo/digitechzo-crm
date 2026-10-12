import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/hooks/useAuth';
import { SidebarThemeProvider } from '@/context/SidebarThemeContext';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarThemeProvider>
          {children}
        </SidebarThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
