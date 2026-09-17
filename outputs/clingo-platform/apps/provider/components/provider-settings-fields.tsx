import type { ReactNode } from "react";
import { ProviderToggle } from "./provider-toggle";

export const settingsAsset = (name: string) => `/figma-assets/settings/${name}`;

export function SettingsSection({ title, description, children, className = "" }: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`settings-section ${className}`} aria-label={title}>
      <div className="settings-section-heading"><h2>{title}</h2><p>{description}</p></div>
      {children}
    </section>
  );
}

export function SettingsField({ label, value, action, verified = false, password = false, compact = false, className = "", placeholder, prefix, suffix, labelAdornment, readOnly, inputMode, autoComplete, autoFocus, maxLength, type = "text" }: {
  label: string;
  value?: string;
  action?: "Edytuj" | "Skopiuj";
  verified?: boolean;
  password?: boolean;
  compact?: boolean;
  className?: string;
  placeholder?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  labelAdornment?: ReactNode;
  readOnly?: boolean;
  inputMode?: "text" | "numeric";
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  type?: "text" | "tel" | "email";
}) {
  return (
    <div className={`settings-field-row${compact ? " is-compact" : ""} ${className}`}>
      <label className={`settings-field${password ? " is-password" : ""}`}>
        <span className="settings-field-label">{label}{labelAdornment}</span>
        {prefix}
        <input aria-label={label} type={password ? "password" : type} defaultValue={value ?? ""} placeholder={placeholder} readOnly={readOnly ?? !password} inputMode={inputMode} autoComplete={autoComplete ?? (password ? "off" : undefined)} autoFocus={autoFocus} maxLength={maxLength} />
        {suffix}
        {action ? <button type="button" className="settings-field-action" aria-label={`${action}: ${label}`}>{action}</button> : null}
      </label>
      {verified ? <span className="settings-verified"><img src={settingsAsset("verified.svg")} alt="" />Zweryfikowany</span> : null}
    </div>
  );
}

export function SettingsButton({ children, disabled = false, className = "" }: { children: ReactNode; disabled?: boolean; className?: string }) {
  return <button type="button" className={`settings-button ${className}`} disabled={disabled}>{children}</button>;
}

export function SettingsToggle({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="settings-toggle-row">
      <ProviderToggle label={label} checked={checked} />
      <span>{label}</span>
    </div>
  );
}
