import type { BookingPhotoRef } from "../../api/src/dashboard/booking-photo.types";

export function BookingPhotoGallery({ photos, orderId, provider = false }: { photos?: BookingPhotoRef[]; orderId: string; provider?: boolean }) {
  if (!photos?.length) return null;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{photos.map(photo => <a key={photo.id} href={`/api/${provider ? "provider-booking-photos" : "booking-photos"}/${orderId}/${photo.id}`} target="_blank" rel="noreferrer" aria-label={photo.label}><img src={`/api/${provider ? "provider-booking-photos" : "booking-photos"}/${orderId}/${photo.id}`} alt={photo.label} loading="lazy" style={{ height: 85, width: 110, borderRadius: 12, border: "1px solid #e6edf3", objectFit: "cover" }} /></a>)}</div>;
}
