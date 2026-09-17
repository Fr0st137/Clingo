import { OrderReschedulePage } from "../../../components/order-flow";
import { getOrder, getRescheduleAvailability, rescheduleOrder } from "../../../lib/api";
import type { RescheduleActions } from "../../../lib/order-reschedule";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export default async function RescheduleOrderRoute({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const id = typeof params?.id === "string" ? params.id : undefined;
  const cookieStore = await cookies();
  const email = decodeURIComponent(cookieStore.get("clingo-user-email")?.value ?? "");
  const order = id && email ? await getOrder(id, email).catch(() => null) : null;
  const requestedSession = typeof params?.session === "string" && /^\d+$/.test(params.session) ? Number(params.session) : undefined;
  const initialSessionIndex = requestedSession !== undefined && requestedSession < (order?.bookingDetails?.sessions?.length ?? 0) ? requestedSession : undefined;

  const loadAvailability: RescheduleActions["loadAvailability"] = async (month, sessionIndex) => {
    "use server";
    if (!id) return { error: "Nie znaleziono zamówienia." };
    try { return { data: await getRescheduleAvailability(id, month, sessionIndex) }; }
    catch (error) { return { error: error instanceof Error ? error.message : "Nie udało się pobrać dostępności." }; }
  };
  const save: RescheduleActions["save"] = async (startsAt, endsAt, sessionIndex) => {
    "use server";
    if (!id) return { error: "Nie znaleziono zamówienia." };
    try {
      await rescheduleOrder(id, email, startsAt, endsAt, sessionIndex);
      revalidatePath("/zamowienia");
      revalidatePath("/zamowienia/szczegoly");
      return { data: true };
    } catch (error) { return { error: error instanceof Error ? error.message : "Nie udało się zapisać terminu." }; }
  };
  return <OrderReschedulePage order={order} initialSessionIndex={initialSessionIndex} loadAvailability={loadAvailability} save={save} />;
}
