import type { ComponentProps } from "react";

export function ProviderPaymentButton({ className = "", type = "button", ...props }: ComponentProps<"button">) {
  return <button {...props} type={type} className={`payment-button ${className}`} />;
}
