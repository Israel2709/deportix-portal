import { EditTeamView } from '@/components/views/EditTeamForm';

export default async function Page({
  params,
}: {
  params: Promise<{ leagueId: string; teamId: string }>;
}) {
  const { leagueId, teamId } = await params;
  return <EditTeamView leagueId={leagueId} teamId={teamId} />;
}
