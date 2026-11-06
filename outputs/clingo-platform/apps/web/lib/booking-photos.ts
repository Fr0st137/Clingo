"use client";
import { useEffect, useState } from "react";
import { MAX_BOOKING_PHOTOS, MAX_BOOKING_PHOTO_DATA_URL, type BookingPhotoDraft } from "../../api/src/dashboard/booking-photo.types";

const uuid = (value: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export function useBookingPhotos(providerId: string, initialDraftId = "") {
  const [draftId, setDraftId] = useState(""), [photos, setValue] = useState<BookingPhotoDraft[]>([]), [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const key = (id: string) => `clingo-customer-photos:${providerId}:${id}`;
  useEffect(() => {
    const id = uuid(initialDraftId) ? initialDraftId : crypto.randomUUID();
    setDraftId(id); setReady(false); setError("");
    try {
      const saved = JSON.parse(sessionStorage.getItem(key(id)) ?? "[]");
      if (!Array.isArray(saved) || saved.length > MAX_BOOKING_PHOTOS || saved.some(row => !row || !uuid(row.id ?? "") || typeof row.dataUrl !== "string" || row.dataUrl.length > MAX_BOOKING_PHOTO_DATA_URL || !/^data:image\/(jpeg|png|webp);base64,/.test(row.dataUrl))) throw Error("Invalid draft");
      setValue(saved);
    } catch { setValue([]); setError("Nie udało się odtworzyć zdjęć. Dodaj je ponownie przed zamówieniem."); }
    setReady(true);
  }, [providerId, initialDraftId]);
  function change(next: BookingPhotoDraft[]) {
    if (!ready || !draftId) throw Error("Poczekaj na wczytanie zdjęć.");
    try { sessionStorage.setItem(key(draftId), JSON.stringify(next)); }
    catch { throw Error("Brak miejsca na zachowanie zdjęć w przeglądarce. Usuń część zdjęć i spróbuj ponownie."); }
    setValue(next); setError("");
  }
  function clear() { try { sessionStorage.removeItem(key(draftId)); } catch { /* The order is already saved. */ } }
  return { draftId, photos, ready, error, change, clear };
}
