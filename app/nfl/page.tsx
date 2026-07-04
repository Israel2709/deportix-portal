import { NflView } from '@/components/views/NflView';
import { parseNflTab } from '@/lib/nfl-paths';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <NflView initialTab={parseNflTab(tab)} />;
}
