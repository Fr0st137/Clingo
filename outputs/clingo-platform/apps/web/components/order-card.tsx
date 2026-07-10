export type OrderCardData = {
  actions: string[];
  address: string;
  avatar?: "paulina" | "klaudia";
  dateLines: string[];
  details: string;
  id?: string;
  logo?: "stepapp";
  mode: string;
  modeTone?: string;
  provider: string;
  range?: boolean;
  status: string;
};

type OrderCardProps = {
  onPrimaryAction?: (order: OrderCardData) => void;
  order: OrderCardData;
};

const orderAssets = {
  arrowRight: "/figma-assets/order-arrow-right.svg",
  klaudia: "/figma-assets/order-klaudia.png",
  map: "/figma-assets/order-map.svg",
  paulina: "/figma-assets/order-paulina.png",
  stepapp: "/figma-assets/favorite-stepapp.png"
};

function actionHref(action: string) {
  if (action.includes("Szczeg")) {
    return "/zamowienia/szczegoly";
  }

  if (action.includes("Prze")) {
    return "/zamowienia/przeloz";
  }

  if (action.includes("Odwo")) {
    return "/zamowienia/odwolaj";
  }

  if (action.includes("Dodaj")) {
    return "/opinie/dodaj";
  }

  if (action.includes("ponownie")) {
    return "/zamowienie";
  }

  return "#";
}

function Badge({ children, tone, width }: { children: string; tone?: string; width: number }) {
  const classes =
    tone === "green"
      ? "bg-[#dcfce7] text-[#22aa5f]"
      : tone === "blue"
        ? "bg-[#e6f3ff] text-[#0079de]"
        : "bg-[#f3f6fa] text-[#2e3b4c]";

  return (
    <span
      className={`flex h-[25px] items-center rounded-[30px] px-[12px] text-[12px] font-normal leading-[15px] ${classes}`}
      style={{ width }}
    >
      {children}
    </span>
  );
}

function ProviderAvatar({ order, size = 66 }: { order: OrderCardData; size?: 64 | 66 }) {
  if (order.logo === "stepapp") {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-[99px] bg-[#ffd6e6] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.15)]"
        style={{ height: size, width: size }}
      >
        <img
          alt=""
          className="absolute left-[5.12%] top-[37.14%] h-[24.84%] w-[89.28%] max-w-none"
          src={orderAssets.stepapp}
        />
      </div>
    );
  }

  if (order.avatar === "klaudia") {
    return (
      <div className="relative shrink-0 overflow-hidden rounded-[99px]" style={{ height: size, width: size }}>
        <img alt="" className="absolute left-0 top-[-0.16%] h-[161.11%] w-full max-w-none" src={orderAssets.klaudia} />
        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.15)]" />
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[99px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.16)]"
      style={{ height: size, width: size }}
    >
      <img alt="" className="absolute inset-0 h-full w-full max-w-none rounded-[99px] object-contain" src={orderAssets.paulina} />
      <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.15)]" />
    </div>
  );
}

function LocationLine({ address }: { address: string }) {
  return (
    <div className="mt-[5px] flex h-[17px] items-center gap-[5px] text-[13px] font-normal leading-[17px] text-[#7c8691]">
      <img alt="" className="h-[12px] w-[12px] shrink-0" src={orderAssets.map} />
      <span className="whitespace-nowrap">{address}</span>
    </div>
  );
}

function ButtonLink({
  children,
  tone,
  width
}: {
  children: string;
  tone: "blue" | "light";
  width: number;
}) {
  const classes =
    tone === "blue"
      ? "bg-[#0079de] text-white"
      : "border border-[#d9dfe7] bg-[#f8fafc] text-[#2e3b4c]";

  return (
    <a
      className={`flex h-[41px] items-center justify-center rounded-[30px] text-[14px] font-normal leading-[17px] ${classes}`}
      href={actionHref(children)}
      style={{ width }}
    >
      {children}
    </a>
  );
}

function DateBlock({ dateLines, range }: { dateLines: string[]; range?: boolean }) {
  if (range) {
    return (
      <div className="absolute left-[578px] top-[74px] h-[58px] w-[142px] text-right text-[14px] font-normal leading-[17px] text-[#2e3b4c]">
        <p className="m-0 whitespace-nowrap">{dateLines[0]}</p>
        <p className="m-0 mt-[5px] h-[14px] leading-[14px]">↓</p>
        <p className="m-0 mt-[5px] whitespace-nowrap">{dateLines[1]}</p>
      </div>
    );
  }

  return (
    <div className="absolute left-[578px] top-[80px] h-[39px] w-[142px] text-right text-[14px] font-normal leading-[17px] text-[#2e3b4c]">
      <p className="m-0 whitespace-nowrap">{dateLines[0]}</p>
      <div className="mt-[5px] flex h-[17px] items-center justify-end gap-[10px]">
        <span>{dateLines[1]}</span>
        <img alt="" className="h-[14px] w-[14px]" src={orderAssets.arrowRight} />
        <span>{dateLines[2]}</span>
      </div>
    </div>
  );
}

function UpcomingOrderCard({ order }: OrderCardProps) {
  const isMultiSession = order.mode === "Wielosesyjne";

  return (
    <article
      className="relative h-[222px] w-[745px] overflow-hidden rounded-[18px] border border-[#e6edf3] bg-white shadow-[0px_8px_24px_0px_rgba(15,23,42,0.08)]"
      data-node-id={isMultiSession ? "5087:8138" : "4955:7904"}
    >
      <div className="absolute left-[25px] top-[25px] flex h-[25px] w-[695px] items-start gap-[10px]">
        <Badge tone="green" width={153}>
          {order.status}
        </Badge>
        <Badge tone={isMultiSession ? "blue" : "neutral"} width={isMultiSession ? 99 : 103}>
          {order.mode}
        </Badge>
      </div>

      <div className="absolute left-[25px] top-[70px] flex h-[66px] items-center gap-[10px]">
        <ProviderAvatar order={order} />
        <div className="ml-0 h-[63px] min-w-0 pt-[1.5px]">
          <h3 className="m-0 whitespace-nowrap text-[16px] font-bold leading-[19px] text-[#2e3b4c]">
            {order.provider}
          </h3>
          <p className="m-0 mt-[5px] whitespace-nowrap text-[13px] font-normal leading-[17px] text-[#7c8691]">
            {order.details}
          </p>
          <LocationLine address={order.address} />
        </div>
      </div>

      <DateBlock dateLines={order.dateLines} range={order.range} />

      <div className="absolute left-[25px] top-[156px] flex h-[41px] w-[695px] items-center">
        <ButtonLink tone="blue" width={168}>
          {order.actions[0]}
        </ButtonLink>
        <div className="flex flex-1 justify-end gap-[15px]">
          {order.actions.slice(1).map((action) => (
            <ButtonLink key={action} tone="light" width={action.includes("Prze") ? 148 : 152}>
              {action}
            </ButtonLink>
          ))}
        </div>
      </div>
    </article>
  );
}

export function OrderCard(props: OrderCardProps) {
  return <UpcomingOrderCard {...props} />;
}

export function CompletedOrderCard({ order }: OrderCardProps) {
  return (
    <article
      className="relative h-[159px] w-[745px] overflow-hidden rounded-[18px] border border-[#e6edf3] bg-white shadow-[0px_8px_24px_0px_rgba(15,23,42,0.06)]"
      data-node-id="4966:7979"
    >
      <div className="absolute left-[25px] top-[25px] flex h-[25px] w-[247px] items-start gap-[10px]">
        <Badge width={134}>{order.status}</Badge>
        <Badge width={103}>{order.mode}</Badge>
      </div>

      <div className="absolute left-[423px] top-[35px] flex h-[41px] w-[297px] items-start gap-[15px]">
        <ButtonLink tone="light" width={123}>
          {order.actions[0]}
        </ButtonLink>
        <ButtonLink tone="blue" width={159}>
          {order.actions[1]}
        </ButtonLink>
      </div>

      <div className="absolute left-[25px] top-[70px] flex h-[64px] items-start gap-[10px]">
        <ProviderAvatar order={order} size={64} />
        <div className="ml-0 h-[61px] min-w-0 pt-[3px]">
          <h3 className="m-0 whitespace-nowrap text-[14px] font-bold leading-[17px] text-[#2e3b4c]">
            {order.provider}
          </h3>
          <p className="m-0 mt-[5px] whitespace-nowrap text-[13px] font-normal leading-[17px] text-[#7c8691]">
            {order.details}
          </p>
          <LocationLine address={order.address} />
        </div>
      </div>

      <div className="absolute left-[578px] top-[95px] h-[39px] w-[142px] text-right text-[14px] font-normal leading-[17px] text-[#2e3b4c]">
        <p className="m-0 whitespace-nowrap">{order.dateLines[0]}</p>
        <div className="mt-[5px] flex h-[17px] items-center justify-end gap-[10px]">
          <span>{order.dateLines[1]}</span>
          <img alt="" className="h-[14px] w-[14px]" src={orderAssets.arrowRight} />
          <span>{order.dateLines[2]}</span>
        </div>
      </div>
    </article>
  );
}
