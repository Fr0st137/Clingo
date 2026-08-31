"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function OrdersUnavailable() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex min-h-[222px] w-full max-w-[745px] flex-col items-center justify-center rounded-[18px] border border-[#e6edf3] bg-white px-6 py-8 text-center shadow-[0px_8px_24px_0px_rgba(15,23,42,0.08)]" aria-busy={isPending}>
      <div role="status" aria-live="polite">
        <h3 className="text-[18px] font-bold text-clingo-ink">Nie możemy teraz pobrać rezerwacji</h3>
        <p className="mt-3 max-w-[470px] text-[14px] leading-5 text-clingo-muted">
          Połączenie z serwerem jest chwilowo niedostępne. Spróbuj ponownie za moment.
        </p>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => router.refresh())}
        className="mt-6 rounded-full bg-clingo-blue px-6 py-3 text-[14px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clingo-blue disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Łączenie…" : "Spróbuj ponownie"}
      </button>
    </div>
  );
}
