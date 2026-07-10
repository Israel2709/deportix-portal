import { LigaMxMatchDetail } from '@/components/views/liga-mx/LigaMxMatchDetail';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ seasonId?: string; year?: string }>;
}) {
  const { matchId } = await params;
  const { seasonId, year } = await searchParams;
  return (
    <LigaMxMatchDetail
      matchId={decodeURIComponent(matchId)}
      seasonId={seasonId ? decodeURIComponent(seasonId) : undefined}
      year={year ? decodeURIComponent(year) : undefined}
    />
  );
}
