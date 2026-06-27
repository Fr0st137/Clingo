"use client";

import { X } from "lucide-react";
import { OrderCardData } from "./order-card";

type OrderDetailsModalProps = {
  order: OrderCardData | null;
  onClose: () => void;
};

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#152237]/30 px-4 backdrop-blur-sm">
      <section className="w-full max-w-[520px] rounded-xl border border-[#dce6f2] bg-white p-6 shadow-figma">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-clingo-blue">{order.status}</p>
            <h2 className="mt-2 text-2xl font-bold text-clingo-ink">{order.provider}</h2>
            <p className="mt-2 text-sm text-clingo-muted">{order.details}</p>
          </div>
          <button
            aria-label="Zamknij szczegóły"
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#e3ebf4] text-[#64758c] transition-all hover:border-clingo-blue hover:text-clingo-blue"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between gap-4 rounded-xl bg-[#f7f9fc] px-4 py-3">
            <dt className="text-clingo-muted">Adres</dt>
            <dd className="text-right font-medium text-clingo-ink">{order.address}</dd>
          </div>
          <div className="flex justify-between gap-4 rounded-xl bg-[#f7f9fc] px-4 py-3">
            <dt className="text-clingo-muted">Termin</dt>
            <dd className="text-right font-medium text-clingo-ink">{order.dateLines.join(" / ")}</dd>
          </div>
          <div className="flex justify-between gap-4 rounded-xl bg-[#f7f9fc] px-4 py-3">
            <dt className="text-clingo-muted">Typ</dt>
            <dd className="text-right font-medium text-clingo-ink">{order.mode}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
