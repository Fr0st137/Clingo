export function ProviderEmployeeAvatar({ image, actionIcon, name }: { image: string; actionIcon: string; name?: string }) {
  return (
    <div className={`employee-avatar-placeholder${name ? " has-photo" : ""}`}>
      <img src={image} alt={name ?? ""} />
      <button type="button" disabled aria-label={name ? "Zmień zdjęcie pracownika" : "Dodaj zdjęcie pracownika"}>
        <img src={actionIcon} alt="" />
      </button>
    </div>
  );
}
