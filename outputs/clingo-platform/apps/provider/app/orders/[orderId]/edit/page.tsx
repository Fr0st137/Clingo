import { notFound } from "next/navigation";
import { ProviderOrderEditPage } from "../../../../components/provider-order-edit-page";
import { getEditableOrder } from "../../../../components/provider-orders-data";

export const metadata = { title: "Edycja zamówienia | Panel wykonawcy Clingo" };

export default async function OrderEditPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = getEditableOrder(orderId);
  if (!order) notFound();
  return <ProviderOrderEditPage order={order} key={order.id} />;
}
