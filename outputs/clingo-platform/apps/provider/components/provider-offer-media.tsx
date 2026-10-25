"use client";

import { useRef, useState } from "react";
import type { OfferConfiguration } from "../lib/provider-offers";
const asset = (name: string) => `/figma-assets/services/editor/${name}`;
type Media = NonNullable<OfferConfiguration["presentation"]>;

async function readPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) throw Error("Wybierz zdjęcie JPG, PNG lub WebP do 10 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 24000000) throw Error("Zdjęcie jest zbyt duże. Wybierz plik do 24 megapikseli.");
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw Error("Nie można odczytać zdjęcia.");
    context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [.85, .7, .55, .4]) { const result = canvas.toDataURL("image/jpeg", quality); if (result.length <= 220000) return result; }
    throw Error("Zdjęcie zawiera zbyt wiele szczegółów. Wybierz mniejszy plik.");
  } finally { bitmap.close(); }
}

export function ProviderOfferMedia({ value, onChange, disabled, onBusyChange }: { value?: Media; onChange: (media: Media) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const media = value ?? { banner: null, gallery: [] };
  const bannerInput = useRef<HTMLInputElement>(null), galleryInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function add(files: FileList | File[] | null, kind: "banner" | "gallery") {
    if (!files?.length || busy || disabled) return;
    setBusy(true); onBusyChange(true); setError("");
    try {
      const selected = Array.from(files);
      if (kind === "gallery" && selected.length + media.gallery.length > 10) throw Error("Możesz dodać maksymalnie 10 zdjęć do galerii.");
      const images: string[] = [];
      for (const file of kind === "banner" ? selected.slice(0, 1) : selected) images.push(await readPhoto(file));
      onChange(kind === "banner" ? { ...media, banner: images[0] } : { ...media, gallery: [...media.gallery, ...images] });
    } catch (error) { setError(error instanceof Error ? error.message : "Nie można dodać zdjęcia."); }
    finally { setBusy(false); onBusyChange(false); if (bannerInput.current) bannerInput.current.value = ""; if (galleryInput.current) galleryInput.current.value = ""; }
  }
  return <div className="offer-media-grid">
    <input className="sr-only" type="file" tabIndex={-1} ref={bannerInput} accept="image/jpeg,image/png,image/webp" aria-label="Plik banera" onChange={event => void add(event.target.files, "banner")} />
    <input className="sr-only" type="file" tabIndex={-1} ref={galleryInput} accept="image/jpeg,image/png,image/webp" multiple aria-label="Pliki galerii" onChange={event => void add(event.target.files, "gallery")} />
    <div className="offer-media-section"><div className="offer-media-heading"><div><h3>Baner</h3><p>Wyeksponuj charakter Twojej działalności i przykuj uwagę klientów.</p></div><button type="button" className="offer-config-button is-primary" disabled={disabled || busy} onClick={() => bannerInput.current?.click()}>Dodaj zdjęcie<img src={asset("add-photo.svg")} alt="" /></button></div>
      <div className="offer-banner-wrap" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void add(event.dataTransfer.files, "banner"); }}>
        <button type="button" className="offer-media-drop" disabled={disabled || busy} onClick={() => bannerInput.current?.click()} aria-label={media.banner ? "Zmień baner" : "Dodaj baner"}>{media.banner ? <img className="offer-banner-image" src={media.banner} alt="Baner ogłoszenia" /> : <><img src={asset("image.svg")} alt="" /><strong>Dodaj baner</strong></>}</button>
        {media.banner && <button type="button" className="offer-photo-remove" aria-label="Usuń baner" disabled={disabled || busy} onClick={() => onChange({ ...media, banner: null })}><img src={asset("remove.svg")} alt="" /></button>}
      </div>
    </div>
    <div className="offer-media-section"><div className="offer-media-heading"><div><h3>Galeria zdjęć</h3><p>Podziel się realizacjami z klientami, aby mieli oni lepszy wgląd do Twojej działalności.</p></div><button type="button" className="offer-config-button is-primary" disabled={disabled || busy || media.gallery.length >= 10} onClick={() => galleryInput.current?.click()}>Dodaj zdjęcie<img src={asset("add-photo.svg")} alt="" /></button></div>
      <div className="offer-gallery-grid" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void add(event.dataTransfer.files, "gallery"); }}>
        {media.gallery.map((src, index) => <div className="offer-gallery-photo" key={`${index}-${src.slice(-20)}`}><img src={src} alt={`Realizacja ${index + 1}`} /><button type="button" className="offer-photo-remove" aria-label={`Usuń zdjęcie ${index + 1}`} disabled={disabled || busy} onClick={() => onChange({ ...media, gallery: media.gallery.filter((_, i) => i !== index) })}><img src={asset("remove.svg")} alt="" /></button></div>)}
        {!media.gallery.length && <button type="button" className="offer-gallery-add" disabled={disabled || busy} onClick={() => galleryInput.current?.click()}><img src={asset("image.svg")} alt="" />Dodaj zdjęcie realizacji</button>}
      </div>
    </div>
    {busy && <p role="status">Przygotowywanie zdjęcia…</p>}{error && <p className="provider-feedback is-error" role="alert">{error}</p>}
  </div>;
}
