import Link from 'next/link';
import { tennisTabPath } from '@/lib/tennis-paths';

export function TennisLoaderLink() {
  return (
    <Link
      href={tennisTabPath('loader')}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
    >
      Ir a Carga de datos
    </Link>
  );
}
