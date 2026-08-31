import { OrderSummaryScreen } from "../../../components/order-booking-screens";
import { loadBookingPage } from "../../../lib/booking-page";

export default async function OrderSummaryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <OrderSummaryScreen {...await loadBookingPage(await searchParams, "/zamowienie/podsumowanie")} />;
}
