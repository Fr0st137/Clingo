"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Star, ImagePlus } from "lucide-react";
import { accountRequest } from "../lib/account-client";
import type { ReviewImage } from "./review-card";
export type ReviewEditorData = { avatarTone: "person" | "brand" | "light"; content?: string; id: string; images?: ReviewImage[]; person: string; rating?: number; service: string; };
type Photo = ReviewImage & { dataUrl?: string };
export function ReviewEditorModal({ mode, review }: { mode: "add" | "edit"; review: ReviewEditorData }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState(review.rating ?? 0);
  const [content, setContent] = useState(review.content ?? "");
  const [photos, setPhotos] = useState<Photo[]>(review.images ?? []);
  const [saving, setSaving] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState("");
  const title = mode === "edit" ? "Edytuj opinię" : "Dodaj opinię";
  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setStatus("");
    if (files.length + photos.length > 3) { setStatus("Możesz dodać maksymalnie 3 zdjęcia."); return; }
    setLoadingPhotos(true);
    try {
      const added: Photo[] = [];
      for (const file of Array.from(files)) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error("Wybierz JPG, PNG lub WebP do 2 MB.");
        const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Nie można odczytać pliku.")); reader.readAsDataURL(file); });
        added.push({ id: crypto.randomUUID(), label: "Zdjęcie efektów usługi", dataUrl });
      }
      setPhotos(current => [...current, ...added]);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Nie udało się dodać zdjęć."); }
    finally { setLoadingPhotos(false); if (picker.current) picker.current.value = ""; }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setStatus("");
    if (!rating) { setStatus("Wybierz ocenę od 1 do 5."); return; }
    if (!content.trim()) { setStatus("Wpisz treść opinii."); return; }
    setSaving(true);
    try {
      await accountRequest(`reviews/${review.id}`, "PUT", { rating, content, images: photos.map(photo => photo.dataUrl ? { dataUrl: photo.dataUrl } : { id: photo.id }) });
      router.push("/opinie"); router.refresh();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Nie udało się zapisać opinii."); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true); setStatus("");
    try { await accountRequest(`reviews/${review.id}`, "DELETE"); router.push("/opinie"); router.refresh(); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Nie udało się usunąć opinii."); }
    finally { setSaving(false); }
  }
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(54,63,76,0.6)] p-3 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-labelledby="review-title" className="relative max-h-[94vh] w-full max-w-[650px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-xl sm:p-8">
      <button aria-label="Zamknij opinię" disabled={saving} onClick={() => router.push("/opinie")} className="absolute right-4 top-4 rounded-full p-2 text-[#536479]" type="button"><X className="h-5 w-5" /></button>
      <h2 id="review-title" className="pr-10 text-[24px] font-bold text-clingo-ink">{title}</h2>
      <p className="mt-2 text-[14px] text-clingo-muted">{review.person} · {review.service}</p>
      <form onSubmit={save}>
        <fieldset disabled={saving || loadingPhotos} className="mt-6 grid gap-5">
          <fieldset><legend className="mb-2 text-[14px] font-semibold text-clingo-ink">Twoja ocena</legend><div className="flex gap-3">{[1,2,3,4,5].map(value => <label key={value} className="cursor-pointer rounded-lg p-1 focus-within:ring-2 focus-within:ring-[#0079de]">
            <input type="radio" className="sr-only" name="rating" aria-label={`${value} ${value === 1 ? "gwiazdka" : value < 5 ? "gwiazdki" : "gwiazdek"}`} checked={rating === value} onChange={() => setRating(value)} />
            <Star className={`h-8 w-8 ${value <= rating ? "fill-[#f2bd1d] text-[#f2bd1d]" : "text-[#b4bdc7]"}`} />
          </label>)}</div></fieldset>
          <label className="text-[14px] font-semibold text-clingo-ink">Treść opinii<textarea aria-label="Treść opinii" required maxLength={1000} autoFocus className="mt-2 min-h-[140px] w-full rounded-[15px] border border-[#dce4ee] p-4 text-[14px] font-normal outline-none focus:border-[#0079de]" value={content} onChange={event => setContent(event.target.value)} placeholder="Opisz swoje doświadczenie z usługą." /><span className="block text-right text-[12px] font-normal text-clingo-muted">{content.length}/1000</span></label>
          <div><p className="mb-3 text-[14px] font-semibold text-clingo-ink">Zdjęcia (opcjonalnie)</p><div className="flex flex-wrap gap-3">{photos.map(photo => <div key={photo.id} className="relative"><img src={photo.dataUrl || photo.url} alt={photo.label} className="h-[85px] w-[110px] rounded-xl object-cover" /><button aria-label="Usuń zdjęcie" type="button" onClick={() => setPhotos(current => current.filter(item => item.id !== photo.id))} className="absolute right-1 top-1 rounded-full bg-white p-1"><X className="h-4 w-4" /></button></div>)}
          {photos.length < 3 && <button type="button" onClick={() => picker.current?.click()} className="grid h-[85px] w-[110px] place-items-center rounded-xl border border-dashed border-[#9caebf] text-[#0079de]" aria-label="Dodaj zdjęcia"><ImagePlus className="h-6 w-6" /></button>}</div>
          <input ref={picker} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" multiple onChange={event => void addPhotos(event.target.files)} />
          <p className="mt-2 text-[12px] text-clingo-muted">Do 3 zdjęć JPG, PNG lub WebP, każde do 2 MB i 16 megapikseli.</p></div>
          <p className="rounded-xl bg-[#f4f8fc] p-3 text-[13px] leading-5 text-[#536479]">Opinia i zdjęcia będą publiczne na profilu wykonawcy. Pokazujemy imię i pierwszą literę nazwiska. Nie dodawaj danych osobowych ani zdjęć osób bez ich zgody.</p>
        </fieldset>
        {status && <p role="alert" className="mt-4 text-[14px] text-red-700">{status}</p>}
        {confirmDelete && <p role="alert" className="mt-4 text-[14px] text-red-700">Usunąć tę opinię wraz ze zdjęciami? Kliknij ponownie „Usuń opinię”, aby potwierdzić.</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">{mode === "edit" && <button type="button" disabled={saving || loadingPhotos} onClick={remove} className="mr-auto rounded-full border border-red-200 px-4 py-3 text-[14px] text-red-700">Usuń opinię</button>}
        <button disabled={saving || loadingPhotos} type="submit" className="rounded-full bg-[#0079de] px-7 py-3 text-[14px] font-semibold text-white disabled:opacity-50">{saving ? "Zapisywanie…" : loadingPhotos ? "Wczytywanie zdjęć…" : "Zapisz opinię"}</button></div>
      </form>
    </section>
  </div>;
}
