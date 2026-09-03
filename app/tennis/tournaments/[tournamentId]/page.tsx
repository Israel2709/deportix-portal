import { TennisTournamentDetail } from '@/components/views/tennis/TennisTournamentDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <TennisTournamentDetail tournamentId={tournamentId} />;
}
