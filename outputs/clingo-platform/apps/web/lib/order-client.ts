import type { OrderCardData } from "../components/order-card";

export type CreateOrderInput = {
  addOns: Array<{ id: string; quantity: number }>;
  address: string;
  email: string;
  frequencyId: string;
  pricingId: string;
  providerId: string;
  startsAt: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function createOrder(input: CreateOrderInput): Promise<OrderCardData> {
  const response = await fetch(`${apiBaseUrl}/dashboard/orders`, {
    body: JSON.stringify(input),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Create order request failed with status ${response.status}.`);
  }

  return response.json();
}
