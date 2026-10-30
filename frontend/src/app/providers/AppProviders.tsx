/**
 * Central Application Providers
 * 
 * Combines i18n, toast notifications, and global contexts.
 */

import React, { PropsWithChildren } from 'react';
import { I18nProvider } from '../../i18n/i18nContext';
import { Toaster } from 'sonner';

export const AppProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <I18nProvider>
      {children}
      <Toaster richColors position="top-right" theme="dark" closeButton />
    </I18nProvider>
  );
};
