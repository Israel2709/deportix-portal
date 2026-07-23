import type { ReactNode } from 'react';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { ToastProvider } from '@/components/notifications/ToastProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata = {
  title: 'Deportix API — Portal',
  description: 'Portal de consumo para la API pública de Deportix.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="h-dvh overflow-hidden">
      <body className="flex h-dvh flex-col overflow-hidden antialiased">
        <QueryProvider>
          <ToastProvider>
            <Header />
            <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer className="w-full shrink-0 border-t border-slate-900 px-4 py-3 text-xs text-slate-500 sm:px-6 lg:px-8">
              Deportix API — MVP público. Los datos mostrados reflejan lo que está cargado
              actualmente; la cobertura es parcial y en evolución.
            </footer>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
