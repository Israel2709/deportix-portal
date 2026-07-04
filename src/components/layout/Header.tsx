'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/liga-mx', label: 'Liga MX' },
  { href: '/american-football', label: 'Football americano' },
  { href: '/explorer', label: 'Explorador de API' },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold text-slate-100">
          Deportix <span className="text-blue-400">API</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Principal">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 ${
                  active ? 'bg-blue-500/20 text-blue-200' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={`${getApiBaseUrl()}/docs`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md px-3 py-1.5 text-slate-300 hover:bg-slate-800"
          >
            Documentación ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
