import { AddMatchView } from '@/components/views/AddMatchForm';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { leagueId } = await params;
  const { season } = await searchParams;
  const seasonYear = season && /^\d{4}$/.test(season) ? Number(season) : null;

  return <AddMatchView leagueId={leagueId} seasonYear={seasonYear} />;
}
