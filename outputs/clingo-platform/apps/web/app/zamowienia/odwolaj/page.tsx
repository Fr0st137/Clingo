import { OrderCancelPage } from "../../../components/order-flow";
import { cancelOrder, getOrder } from "../../../lib/api";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CancelOrderRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = typeof params?.id === "string" ? params.id : undefined;
  const cookieStore = await cookies();
  const email = decodeURIComponent(cookieStore.get("clingo-user-email")?.value ?? "");
  const order = id && email ? await getOrder(id, email).catch(() => null) : null;

  async function cancelCurrentOrder() {
    "use server";

    if (id) {
      await cancelOrder(id, email);
    }

    redirect("/zamowienia");
  }

  return <OrderCancelPage action={cancelCurrentOrder} order={order} />;
}
