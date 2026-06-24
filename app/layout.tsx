import type { ReactNode } from 'react';
import './globals.css';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Deportix API — Portal',
  description: 'Consumer portal for the public Deportix API.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-500">
          Deportix API — public MVP. Data shown reflects what is currently loaded; coverage is
          partial and evolving.
        </footer>
      </body>
    </html>
  );
}
