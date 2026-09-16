export function ProviderToggle({ label, checked }: { label: string; checked: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="settings-toggle" disabled><img src={`/figma-assets/settings/notifications/switch-${checked ? "on" : "off"}.svg`} alt="" /></button>;
}
