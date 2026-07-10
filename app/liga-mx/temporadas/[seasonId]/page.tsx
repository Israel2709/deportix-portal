import { LigaMxSeasonDetail } from '@/components/views/liga-mx/LigaMxSeasonDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  return <LigaMxSeasonDetail seasonId={decodeURIComponent(seasonId)} />;
}
