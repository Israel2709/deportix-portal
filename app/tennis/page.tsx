import { TennisView } from '@/components/views/TennisView';
import { parseTennisTab } from '@/lib/tennis-paths';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <TennisView initialTab={parseTennisTab(tab)} />;
}
