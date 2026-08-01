import Link from 'next/link';
import type { ReactNode } from 'react';
import { formula1TabPath } from '@/lib/formula-1-paths';

export function Formula1DetailLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={formula1TabPath('contenido')}
          className="text-sm text-blue-400 hover:underline"
        >
          ← Volver a Formula 1
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
