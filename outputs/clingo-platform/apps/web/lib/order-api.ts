export class OrderApiUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("Serwer rezerwacji jest chwilowo niedostępny.", options);
    this.name = "OrderApiUnavailableError";
  }
}

export class OrderApiResponseError extends Error {
  constructor(public readonly status: number) {
    super("Nie udało się pobrać rezerwacji.");
    this.name = "OrderApiResponseError";
  }
}

// Only reads are retried. Never repeat a booking, cancellation or reschedule here.
export async function fetchOrderData<T>(url: string, headers: HeadersInit): Promise<T> {
  const signal = AbortSignal.timeout(8000);
  const retryDelays = [0, 350, 1000];

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt]) {
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }

    try {
      const response = await fetch(url, { cache: "no-store", headers, signal });
      if (!response.ok) {
        await response.body?.cancel();
        // Authentication and missing orders must retain their original meaning.
        if (response.status < 500) throw new OrderApiResponseError(response.status);
        throw new OrderApiUnavailableError();
      }
      return await response.json();
    } catch (error) {
      if (error instanceof OrderApiResponseError) throw error;
      if (signal.aborted || attempt === retryDelays.length - 1) {
        throw new OrderApiUnavailableError({ cause: error });
      }
    }
  }

  throw new OrderApiUnavailableError();
}
