import { TennisRoundDetail } from '@/components/views/tennis/TennisRoundDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  return <TennisRoundDetail roundId={roundId} />;
}
