import { OrderConfirmationScreen } from "../../../components/order-booking-screens";
import { getOrder } from "../../../lib/api";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export default async function OrderConfirmationRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await searchParams;
  const store = await cookies();
  if (typeof id !== "string") notFound();
  const order = await getOrder(id, decodeURIComponent(store.get("clingo-user-email")?.value ?? "")).catch(() => null);
  if (!order) notFound();
  return <OrderConfirmationScreen order={order} />;
}
