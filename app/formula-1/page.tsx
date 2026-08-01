import { Formula1View } from '@/components/views/Formula1View';
import { parseFormula1Tab } from '@/lib/formula-1-paths';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <Formula1View initialTab={parseFormula1Tab(tab)} />;
}
