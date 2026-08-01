import { Formula1DriverDetail } from '@/components/views/formula-1/Formula1DriverDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const { driverId } = await params;
  return <Formula1DriverDetail driverId={driverId} />;
}
