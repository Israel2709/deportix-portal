import { Formula1CircuitDetail } from '@/components/views/formula-1/Formula1CircuitDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ circuitId: string }>;
}) {
  const { circuitId } = await params;
  return <Formula1CircuitDetail circuitId={circuitId} />;
}
