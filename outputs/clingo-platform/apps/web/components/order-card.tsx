import { MapPin } from "lucide-react";

export type OrderCardData = {
  id?: string;
  status: string;
  mode: string;
  modeTone?: string;
  provider: string;
  details: string;
  address: string;
  logo?: string;
  avatar?: string;
  dateLines: string[];
  range?: boolean;
  actions: string[];
};

type OrderCardProps = {
  order: OrderCardData;
  onPrimaryAction?: (order: OrderCardData) => void;
};

function StatusBadge({ children, tone }: { children: string; tone?: string }) {
  const tones: Record<string, string> = {
    green: "bg-[#e0f9e9] text-[#23aa69]",
    blue: "bg-[#e6f3ff] text-clingo-blue",
    neutral: "bg-[#f3f6fa] text-[#66788e]"
  };

  return (
    <span className={`inline-flex min-h-[25px] items-center rounded-full px-3 text-[12px] ${tones[tone ?? "neutral"]}`}>
      {children}
    </span>
  );
}

function ProviderImage({ logo, avatar }: { logo?: string; avatar?: string }) {
  if (logo) {
    return (
      <div className="grid h-[66px] w-[66px] shrink-0 place-items-center rounded-full bg-[#facce2] text-[13px] font-extrabold text-[#53236e]">
        {logo}
      </div>
    );
  }

  return (
    <div
      className={[
        "h-[66px] w-[66px] shrink-0 rounded-full",
        avatar === "woman"
          ? "bg-[radial-gradient(circle_at_50%_34%,#46301f_0_13%,transparent_14%),radial-gradient(circle_at_50%_72%,#f0cfb0_0_30%,transparent_31%),linear-gradient(135deg,#f6d9c7,#fff2eb)]"
          : "bg-[radial-gradient(circle_at_54%_34%,#2c2825_0_13%,transparent_14%),radial-gradient(circle_at_50%_72%,#e7c19d_0_30%,transparent_31%),linear-gradient(135deg,#d9ecff,#fff1dc)]"
      ].join(" ")}
    />
  );
}

export function OrderCard({ order, onPrimaryAction }: OrderCardProps) {
  const [primaryAction, ...secondaryActions] = order.actions;

  return (
    <article className="w-full rounded-xl border border-[#dce6f2] bg-white p-5 shadow-figma transition-all hover:-translate-y-0.5 hover:shadow-soft md:min-h-[222px] md:max-w-[745px] md:p-[25px]">
      <div className="flex min-h-[25px] flex-wrap items-center gap-[10px]">
        <StatusBadge tone="green">{order.status}</StatusBadge>
        <StatusBadge tone={order.modeTone === "blue" ? "blue" : "neutral"}>{order.mode}</StatusBadge>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_170px] md:items-center md:gap-[10px]">
        <div className="flex items-center gap-[10px] md:contents">
          <ProviderImage avatar={order.avatar} logo={order.logo} />
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold leading-[19px] text-clingo-ink">{order.provider}</h3>
            <p className="mt-[5px] text-[13px] leading-[17px] text-clingo-muted">{order.details}</p>
            <div className="mt-[5px] flex items-center gap-[5px] text-[13px] leading-[17px] text-clingo-muted">
              <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.8} />
              <span>{order.address}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-[8px] text-left text-[13px] leading-[17px] text-clingo-ink md:justify-items-end md:text-right">
          <span>{order.dateLines[0]}</span>
          {order.range ? <span className="text-[#5f6f83]">↓</span> : null}
          <span>{order.dateLines[1]}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-[10px] md:grid-cols-[auto_1fr_auto_auto] md:items-center md:gap-[15px]">
        <button
          className="h-[41px] rounded-full bg-clingo-blue px-[24px] text-[13px] font-bold text-white transition-all hover:bg-clingo-blueDark"
          onClick={() => onPrimaryAction?.(order)}
          type="button"
        >
          {primaryAction}
        </button>
        <span className="hidden md:block" />
        {secondaryActions.map((action) => (
          <button
            className="h-[41px] rounded-full border border-[#e3ebf4] bg-[#f8fafc] px-[24px] text-[13px] text-[#52637a] transition-all hover:border-clingo-blue hover:text-clingo-blue"
            key={action}
            type="button"
          >
            {action}
          </button>
        ))}
      </div>
    </article>
  );
}

export function CompletedOrderCard({ order, onPrimaryAction }: OrderCardProps) {
  return (
    <article className="w-full rounded-xl border border-[#dce6f2] bg-white p-5 shadow-figma transition-all hover:-translate-y-0.5 hover:shadow-soft md:min-h-[159px] md:max-w-[745px] md:p-[25px]">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div className="flex min-h-[25px] flex-wrap gap-[10px]">
          <StatusBadge>{order.status}</StatusBadge>
          <StatusBadge>{order.mode}</StatusBadge>
        </div>
        <div className="grid gap-[10px] md:flex md:gap-[15px]">
          <button className="h-[41px] rounded-full border border-[#e3ebf4] bg-[#f8fafc] px-[24px] text-[13px] text-[#52637a] transition-all hover:border-clingo-blue hover:text-clingo-blue">
            {order.actions[0]}
          </button>
          <button
            className="h-[41px] rounded-full bg-clingo-blue px-[24px] text-[13px] font-bold text-white transition-all hover:bg-clingo-blueDark"
            onClick={() => onPrimaryAction?.(order)}
            type="button"
          >
            {order.actions[1]}
          </button>
        </div>
      </div>

      <div className="mt-[15px] grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_170px] md:items-center md:gap-[10px]">
        <div className="flex items-center gap-[10px] md:contents">
          <ProviderImage />
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-[17px] text-clingo-ink">{order.provider}</h3>
            <p className="mt-[5px] text-[13px] leading-[17px] text-clingo-muted">{order.details}</p>
            <div className="mt-[5px] flex items-center gap-[5px] text-[13px] leading-[17px] text-clingo-muted">
              <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.8} />
              <span>{order.address}</span>
            </div>
          </div>
        </div>
        <div className="grid gap-[8px] text-left text-[13px] leading-[17px] text-clingo-ink md:justify-items-end md:text-right">
          <span>{order.dateLines[0]}</span>
          <span>{order.dateLines[1]}</span>
        </div>
      </div>
    </article>
  );
}
