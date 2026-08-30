import { OrderDetailsPage } from "../../../components/order-flow";
import { getOrder } from "../../../lib/api";
import { cookies } from "next/headers";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderDetailsRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = typeof params?.id === "string" ? params.id : undefined;
  const cookieStore = await cookies();
  const email = decodeURIComponent(cookieStore.get("clingo-user-email")?.value ?? "");
  const order = id && email ? await getOrder(id, email).catch(() => null) : null;

  return <OrderDetailsPage order={order} />;
}
