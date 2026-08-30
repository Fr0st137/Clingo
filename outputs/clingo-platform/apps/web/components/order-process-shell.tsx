import type { ReactNode } from "react";
import { OrderHeader } from "./order-header";
import { OrderSteps } from "./order-steps";

export function OrderProcessShell({ activeStep, children }: { activeStep: 1 | 2 | 3; children: ReactNode }) {
  return (
    <>
      <OrderHeader />
      <main className="relative z-10 mx-auto box-border w-full max-w-[1440px] px-4 pb-[60px] pt-[100px] md:px-0">
        <OrderSteps activeStep={activeStep} />
        <div className="mt-[25px]">{children}</div>
      </main>
    </>
  );
}
