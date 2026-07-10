import { LigaMxTeamDetail } from '@/components/views/liga-mx/LigaMxTeamDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <LigaMxTeamDetail teamId={decodeURIComponent(teamId)} />;
}
