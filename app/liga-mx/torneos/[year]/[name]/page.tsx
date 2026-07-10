import { LigaMxTournamentDetail } from '@/components/views/liga-mx/LigaMxTournamentDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ year: string; name: string }>;
}) {
  const { year, name } = await params;
  return (
    <LigaMxTournamentDetail
      year={decodeURIComponent(year)}
      name={decodeURIComponent(name)}
    />
  );
}
