import { Formula1TeamDetail } from '@/components/views/formula-1/Formula1TeamDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <Formula1TeamDetail teamId={teamId} />;
}
