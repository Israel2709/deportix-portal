import { TennisMatchDetail } from '@/components/views/tennis/TennisMatchDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <TennisMatchDetail matchId={matchId} />;
}
