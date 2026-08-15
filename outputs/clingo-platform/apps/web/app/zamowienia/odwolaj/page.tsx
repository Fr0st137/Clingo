import { OrderCancelPage } from "../../../components/order-flow";
import { cancelOrder, getOrder } from "../../../lib/api";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CancelOrderRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = typeof params?.id === "string" ? params.id : undefined;
  const order = id ? await getOrder(id).catch(() => null) : null;

  async function cancelCurrentOrder() {
    "use server";

    if (id) {
      await cancelOrder(id);
    }

    redirect("/zamowienia");
  }

  return <OrderCancelPage action={cancelCurrentOrder} order={order} />;
}
