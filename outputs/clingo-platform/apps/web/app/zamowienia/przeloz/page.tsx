import { OrderReschedulePage } from "../../../components/order-flow";
import { getOrder, rescheduleOrder } from "../../../lib/api";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RescheduleOrderRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = typeof params?.id === "string" ? params.id : undefined;
  const order = id ? await getOrder(id).catch(() => null) : null;

  async function rescheduleCurrentOrder(formData: FormData) {
    "use server";

    if (!id) {
      return;
    }

    const startsAt = formData.get("startsAt");
    const endsAt = formData.get("endsAt");

    if (typeof startsAt !== "string" || typeof endsAt !== "string") {
      return;
    }

    await rescheduleOrder(id, startsAt, endsAt);
    redirect(`/zamowienia/szczegoly?id=${encodeURIComponent(id)}`);
  }

  return <OrderReschedulePage action={rescheduleCurrentOrder} order={order} />;
}
