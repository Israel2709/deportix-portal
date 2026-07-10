import { AmericanFootballStandingDetail } from '@/components/views/american-football/AmericanFootballStandingDetail';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ standingId: string }>;
  searchParams: Promise<{ league?: string; season?: string }>;
}) {
  const { standingId } = await params;
  const { league, season } = await searchParams;

  return (
    <AmericanFootballStandingDetail
      standingId={decodeURIComponent(standingId)}
      leagueId={league ? decodeURIComponent(league) : ''}
      season={season ? decodeURIComponent(season) : ''}
    />
  );
}
