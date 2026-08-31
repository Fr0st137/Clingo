import { OrderDateScreen } from "../../components/order-booking-screens";
import { loadBookingPage } from "../../lib/booking-page";

export default async function OrderPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <OrderDateScreen {...await loadBookingPage(await searchParams, "/zamowienie")} />;
}
