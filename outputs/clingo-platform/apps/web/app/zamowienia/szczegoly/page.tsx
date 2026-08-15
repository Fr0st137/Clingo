import { OrderDetailsPage } from "../../../components/order-flow";
import { getOrder } from "../../../lib/api";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderDetailsRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = typeof params?.id === "string" ? params.id : undefined;
  const order = id ? await getOrder(id).catch(() => null) : null;

  return <OrderDetailsPage order={order} />;
}
