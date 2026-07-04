import type { ReactNode } from 'react';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { ToastProvider } from '@/components/notifications/ToastProvider';

export const metadata = {
  title: 'Deportix API — Portal',
  description: 'Portal de consumo para la API pública de Deportix.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <ToastProvider>
          <Header />
          <main className="w-full px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <footer className="w-full px-4 py-8 text-xs text-slate-500 sm:px-6 lg:px-8">
          Deportix API — MVP público. Los datos mostrados reflejan lo que está cargado
          actualmente; la cobertura es parcial y en evolución.
        </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
