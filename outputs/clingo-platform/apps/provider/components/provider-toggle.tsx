export function ProviderToggle({ label, checked, onChange, disabled = !onChange }: { label: string; checked: boolean; onChange?: (checked: boolean) => void; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="settings-toggle" disabled={disabled} onClick={() => onChange?.(!checked)}><img src={`/figma-assets/settings/notifications/switch-${checked ? "on" : "off"}.svg`} alt="" /></button>;
}
