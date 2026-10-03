import { notFound } from "next/navigation";
import { ProviderJobsPage } from "../../../../components/provider-jobs-page";
export const metadata = { title: "Edycja zlecenia | Panel wykonawcy Clingo" };
export default async function OrderEditPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(orderId)) notFound();
  return <ProviderJobsPage initialEditId={orderId} />;
}
