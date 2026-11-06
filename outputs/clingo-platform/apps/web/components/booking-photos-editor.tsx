"use client";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { readProviderPhoto } from "../../provider/components/provider-offer-media";
import { MAX_BOOKING_PHOTOS, type BookingPhotoDraft } from "../../api/src/dashboard/booking-photo.types";

export function BookingPhotosEditor({ photos, onChange, required, disabled, onBusyChange }: { photos: BookingPhotoDraft[]; onChange: (photos: BookingPhotoDraft[]) => void; required?: boolean; disabled?: boolean; onBusyChange: (busy: boolean) => void }) {
  const picker = useRef<HTMLInputElement>(null), pending = useRef(false), previewDialog = useRef<HTMLDialogElement>(null);
  const [preview, setPreview] = useState<BookingPhotoDraft | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function add(files: FileList | null) {
    if (!files?.length || pending.current || disabled) return;
    pending.current = true; setBusy(true); onBusyChange(true); setError("");
    try {
      if (photos.length + files.length > MAX_BOOKING_PHOTOS) throw Error("Możesz dodać maksymalnie 10 zdjęć.");
      const added: BookingPhotoDraft[] = [];
      for (const file of Array.from(files)) added.push({ id: crypto.randomUUID(), dataUrl: await readProviderPhoto(file) });
      onChange([...photos, ...added]);
    } catch (failure) { setError(failure instanceof DOMException ? "Nie można odczytać zdjęcia. Wybierz poprawny plik JPG, PNG lub WebP." : failure instanceof Error ? failure.message : "Nie można dodać zdjęcia."); }
    finally { pending.current = false; setBusy(false); onBusyChange(false); if (picker.current) picker.current.value = ""; }
  }
  return <div className="grid min-w-0 gap-[15px]">
    <p className="m-0 text-[13px] leading-5 text-[#7c8691]">{required ? "Dodaj co najmniej jedno zdjęcie obszaru objętego usługą." : "Możesz dodać zdjęcia obszaru objętego usługą."} Zdjęcia otrzyma wykonawca Twojego zamówienia. Maksymalnie 10 plików JPG, PNG lub WebP do 10 MB każdy; zdjęcia są pomniejszane przed wysłaniem.</p>
    <input ref={picker} type="file" className="sr-only" aria-label="Zdjęcia do zamówienia" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled || busy} onChange={event => void add(event.target.files)} />
    <div className="flex flex-wrap gap-3">{photos.map((photo, index) => <div key={photo.id} className="relative">
      <button type="button" onClick={() => { setPreview(photo); previewDialog.current?.showModal(); }} aria-label={`Podgląd zdjęcia ${index + 1}`}><img src={photo.dataUrl} alt={`Zdjęcie obszaru ${index + 1}`} className="h-[85px] w-[110px] rounded-xl border border-[#e6edf3] object-cover" /></button>
      <button aria-label={`Usuń zdjęcie ${index + 1}`} type="button" disabled={disabled || busy} onClick={() => { try { onChange(photos.filter(item => item.id !== photo.id)); setError(""); } catch (failure) { setError((failure as Error).message); } }} className="absolute right-1 top-1 rounded-full bg-white p-1 text-[#2e3b4c]"><X className="h-4 w-4" /></button>
    </div>)}{photos.length < MAX_BOOKING_PHOTOS && <button type="button" disabled={disabled || busy} onClick={() => picker.current?.click()} className="grid h-[85px] w-[110px] place-items-center rounded-xl border border-dashed border-[#9caebf] text-[#0079de] disabled:opacity-40" aria-label="Dodaj zdjęcia do zamówienia"><ImagePlus className="h-6 w-6" /><span className="text-[12px]">Dodaj zdjęcia</span></button>}</div>
    {busy && <p className="m-0 text-[13px] text-[#7c8691]" role="status">Przygotowywanie zdjęć…</p>}
    {error && <p className="m-0 text-[13px] text-[#b52a35]" role="alert">{error}</p>}
    <dialog ref={previewDialog} aria-label="Podgląd zdjęcia do zamówienia" className="max-h-[90vh] max-w-[90vw] rounded-[20px] border-0 bg-white p-[20px] backdrop:bg-black/50"><button type="button" className="mb-3 block rounded-full bg-[#f4f6f9] px-4 py-2 text-[14px] text-[#2e3b4c]" onClick={() => previewDialog.current?.close()}>Zamknij podgląd</button>{preview && <img src={preview.dataUrl} alt="Zdjęcie obszaru objętego usługą" className="max-h-[70vh] max-w-full object-contain" />}</dialog>
  </div>;
}
