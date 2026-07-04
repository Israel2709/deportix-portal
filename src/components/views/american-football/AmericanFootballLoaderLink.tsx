import Link from 'next/link';
import { americanFootballTabPath } from '@/lib/american-football-paths';

export function AmericanFootballLoaderLink({
  children = 'Ir a carga de datos',
  className = 'inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={americanFootballTabPath('loader')} className={className}>
      {children}
    </Link>
  );
}
