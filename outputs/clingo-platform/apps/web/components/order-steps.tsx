const steps = [
  { id: 1, label: "Wybierz termin" },
  { id: 2, label: "Podsumowanie" },
  { id: 3, label: "Gotowe" }
] as const;

export function OrderSteps({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Etapy zamówienia" className="relative mx-auto h-[80px] w-full max-w-[1200px]" data-node-id="4099:5842">
      <span className="absolute left-[6%] top-[30px] h-px w-[43.6%] bg-[#dce0e3]" aria-hidden="true" />
      <span className="absolute left-[50.4%] top-[30px] h-px w-[43.6%] bg-[#dce0e3]" aria-hidden="true" />

      <ol className="relative z-10 flex h-full w-full items-start justify-between p-0">
        {steps.map((step) => {
          const isActive = step.id === activeStep;

          return (
            <li className="flex w-[112px] flex-col items-center justify-center gap-[10px] p-[10px] sm:w-[135px]" key={step.id}>
              <span
                aria-current={isActive ? "step" : undefined}
                className={[
                  "flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[30px] text-[16px]",
                  isActive ? "bg-[#0079de] font-medium text-white" : "bg-white font-normal text-[#2e3b4c]"
                ].join(" ")}
              >
                {step.id}
              </span>
              <span className="whitespace-nowrap text-[13px] font-normal text-[#2e3b4c] sm:text-[14px]">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
