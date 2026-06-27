import { dashboardFallback } from "./dashboard-data";

export async function getDashboard() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    return dashboardFallback;
  }

  try {
    const response = await fetch(`${baseUrl}/dashboard/orders`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      return dashboardFallback;
    }

    return response.json();
  } catch {
    return dashboardFallback;
  }
}
