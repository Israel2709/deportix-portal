import { LigaMxView } from '@/components/views/LigaMxView';
import { parseLigaMxTab } from '@/lib/liga-mx-paths';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <LigaMxView initialTab={parseLigaMxTab(tab)} />;
}
