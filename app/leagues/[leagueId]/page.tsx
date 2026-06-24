import { LeagueDetail } from '@/components/views/LeagueDetail';

export default async function Page({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  return <LeagueDetail league={leagueId} />;
}
