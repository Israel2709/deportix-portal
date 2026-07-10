import { LigaMxStandingDetail } from '@/components/views/liga-mx/LigaMxStandingDetail';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { teamId } = await params;
  const { season } = await searchParams;
  return (
    <LigaMxStandingDetail
      teamId={decodeURIComponent(teamId)}
      season={season ? decodeURIComponent(season) : ''}
    />
  );
}
