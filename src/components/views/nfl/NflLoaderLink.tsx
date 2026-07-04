import Link from 'next/link';
import { nflTabPath } from '@/lib/nfl-paths';

export function NflLoaderLink({
  children = 'Ir a carga de datos',
  className = 'inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={nflTabPath('loader')} className={className}>
      {children}
    </Link>
  );
}
