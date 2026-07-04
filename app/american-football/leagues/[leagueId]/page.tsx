import { AmericanFootballLeagueBrowse } from '@/components/views/american-football/AmericanFootballLeagueBrowse';

export default async function Page({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  return <AmericanFootballLeagueBrowse leagueId={leagueId} />;
}
