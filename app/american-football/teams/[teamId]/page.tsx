import { AmericanFootballTeamDetail } from '@/components/views/american-football/AmericanFootballTeamDetail';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ league?: string; season?: string }>;
}) {
  const { teamId } = await params;
  const { league, season } = await searchParams;
  return (
    <AmericanFootballTeamDetail
      teamId={decodeURIComponent(teamId)}
      leagueId={league ? decodeURIComponent(league) : undefined}
      season={season ? decodeURIComponent(season) : undefined}
    />
  );
}
