import { AmericanFootballGameDetail } from '@/components/views/american-football/AmericanFootballGameDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  return <AmericanFootballGameDetail gameId={decodeURIComponent(gameId)} />;
}
