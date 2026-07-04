import { NflLeagueBrowse } from '@/components/views/nfl/NflLeagueBrowse';

export default async function Page({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  return <NflLeagueBrowse leagueId={leagueId} />;
}
