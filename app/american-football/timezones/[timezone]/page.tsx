import { AmericanFootballTimezoneDetail } from '@/components/views/american-football/AmericanFootballTimezoneDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ timezone: string }>;
}) {
  const { timezone } = await params;
  return <AmericanFootballTimezoneDetail timezone={decodeURIComponent(timezone)} />;
}
