import { Formula1SeasonBrowse } from '@/components/views/formula-1/Formula1SeasonBrowse';

export default async function Page({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  return <Formula1SeasonBrowse year={year} />;
}
