import { AmericanFootballView } from '@/components/views/AmericanFootballView';
import { parseAmericanFootballTab } from '@/lib/american-football-paths';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <AmericanFootballView initialTab={parseAmericanFootballTab(tab)} />;
}
