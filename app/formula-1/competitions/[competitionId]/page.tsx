import { Formula1CompetitionDetail } from '@/components/views/formula-1/Formula1CompetitionDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  return <Formula1CompetitionDetail competitionId={competitionId} />;
}
