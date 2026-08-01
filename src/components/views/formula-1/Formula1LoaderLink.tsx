import Link from 'next/link';
import { formula1TabPath } from '@/lib/formula-1-paths';

export function Formula1LoaderLink() {
  return (
    <Link
      href={formula1TabPath('loader')}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
    >
      Ir a Carga de datos
    </Link>
  );
}
