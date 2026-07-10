import { AmericanFootballSeasonDetail } from '@/components/views/american-football/AmericanFootballSeasonDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ leagueId: string; year: string }>;
}) {
  const { leagueId, year } = await params;
  return <AmericanFootballSeasonDetail leagueId={decodeURIComponent(leagueId)} year={decodeURIComponent(year)} />;
}
