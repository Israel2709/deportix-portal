import { Formula1RaceDetail } from '@/components/views/formula-1/Formula1RaceDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ raceId: string }>;
}) {
  const { raceId } = await params;
  return <Formula1RaceDetail raceId={raceId} />;
}
