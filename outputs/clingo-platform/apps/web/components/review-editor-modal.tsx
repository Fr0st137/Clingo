"use client";

import { ImagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReviewImage } from "./review-card";

export type ReviewEditorData = {
  avatarTone: "person" | "brand" | "light";
  content?: string;
  id: string;
  images?: ReviewImage[];
  person: string;
  rating?: number;
  service: string;
};

type ReviewEditorModalProps = {
  mode: "add" | "edit";
  review: ReviewEditorData;
};

const reviewApiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const starSrc = "/figma-assets/board-rating-star.svg";

const photoStyles = [
  "bg-[linear-gradient(135deg,#e8eef5_0%,#b9c4ce_45%,#f8fbff_100%)]",
  "bg-[linear-gradient(135deg,#d9c8b7_0%,#8c7f72_48%,#f2ede8_100%)]",
  "bg-[linear-gradient(135deg,#c4b39f_0%,#efe1ce_45%,#8b6d58_100%)]"
];

function defaultPhotos(images?: ReviewImage[]) {
  return (images ?? []).slice(0, 3).map((image, index) => ({
    ...image,
    label: image.label || `Zdjęcie ${index + 1}`
  }));
}

export function ReviewEditorModal({ mode, review }: ReviewEditorModalProps) {
  const router = useRouter();
  const [rating, setRating] = useState(review.rating ?? (mode === "edit" ? 4 : 0));
  const [content, setContent] = useState(review.content ?? "");
  const [photos, setPhotos] = useState(defaultPhotos(review.images));
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  const title = mode === "edit" ? "Edytuj opinię" : "Dodaj opinię";
  const charsLeft = useMemo(() => `${content.length}/1000`, [content]);

  const close = () => {
    router.push("/opinie");
  };

  const addPhoto = () => {
    if (photos.length >= 3) {
      return;
    }

    setPhotos((current) => [
      ...current,
      {
        id: `local-photo-${Date.now()}`,
        label: `Zdjęcie efektów ${current.length + 1}`
      }
    ]);
  };

  const saveReview = async () => {
    if (!rating) {
      setStatus("Wybierz ocenę.");
      return;
    }

    if (!content.trim()) {
      setStatus("Wpisz treść opinii.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      const response = await fetch(`${reviewApiBaseUrl}/dashboard/reviews/opinions/${encodeURIComponent(review.id)}`, {
        body: JSON.stringify({
          content,
          images: photos,
          rating
        }),
        cache: "no-store",
        headers: {
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });

      if (!response.ok) {
        throw new Error(`Review save failed with status ${response.status}.`);
      }

      router.push("/opinie");
      router.refresh();
    } catch {
      setStatus("Nie udało się zapisać opinii.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(54,63,76,0.6)] px-4 backdrop-blur-[3.5px]">
      <div className="relative w-full max-w-[600px] rounded-[25px] bg-white p-[30px] text-[#2e3b4c]">
        <div className="flex flex-col gap-5">
          <header className="grid gap-[10px]">
            <div className="flex w-full items-center justify-between gap-4">
              <h1 className="m-0 text-[24px] font-semibold leading-normal">{title}</h1>
              <button
                className="flex h-[38px] items-center justify-center gap-2 rounded-[99px] bg-[#0079de] px-5 py-3 text-[14px] font-medium text-white"
                onClick={addPhoto}
                type="button"
              >
                Dodaj zdjęcie efektów
                <ImagePlus className="h-[14px] w-[14px]" strokeWidth={2} />
              </button>
            </div>

            <div className="grid gap-[10px]">
              <p className="m-0 text-[14px] font-semibold leading-normal">Dodaj ocenę</p>
              <div className="flex items-center gap-[10px]">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starValue = index + 1;

                  return (
                    <button
                      aria-label={`Ustaw ocenę ${starValue}`}
                      className="h-8 w-8 border-0 bg-transparent p-0"
                      key={starValue}
                      onClick={() => {
                        setStatus("");
                        setRating(starValue);
                      }}
                      type="button"
                    >
                      <img
                        alt=""
                        className={starValue <= rating ? "h-full w-full" : "h-full w-full grayscale opacity-20"}
                        src={starSrc}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          <label className="relative flex h-[163px] w-full items-end">
            <span className="absolute left-[19px] top-0 z-10 rounded-[10px] bg-gradient-to-b from-[#f7fbfe] to-white px-1 py-[2px] text-[14px] font-medium leading-none">
              Twoja opinia
            </span>
            <textarea
              className="h-[155px] w-full resize-none rounded-[30px] border border-[#dce0e3] bg-white px-[19px] py-[18px] pr-[76px] text-[14px] leading-[26px] text-[#334155] outline-none focus:border-[#0079de]"
              maxLength={1000}
              onChange={(event) => {
                setStatus("");
                setContent(event.target.value);
              }}
              placeholder="Opisz swoje doświadczenie z usługą."
              value={content}
            />
            <span className="absolute bottom-[11px] right-[20px] text-[12px] leading-normal text-[#7c8691]">{charsLeft}</span>
          </label>

          {photos.length ? (
            <div className="flex w-full flex-wrap gap-5">
              {photos.map((photo, index) => (
                <div
                  aria-label={photo.label}
                  className={`relative h-[120px] w-[120px] overflow-hidden rounded-[20px] bg-cover bg-center p-[10px] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.15)] ${photoStyles[index % photoStyles.length]}`}
                  key={photo.id}
                >
                  <div className="absolute inset-0 bg-[rgba(0,0,0,0.1)]" />
                  <button
                    aria-label="Usuń zdjęcie"
                    className="absolute right-[10px] top-[10px] grid h-6 w-6 place-items-center rounded-full border-0 bg-white p-0 text-[#d63b3b]"
                    onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))}
                    type="button"
                  >
                    <X className="h-[14px] w-[14px]" strokeWidth={2.4} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {status ? <p className="m-0 text-[13px] font-medium leading-normal text-[#d63b3b]">{status}</p> : null}

          <div className="flex h-12 w-full gap-[15px]">
            <button
              className="flex flex-1 items-center justify-center rounded-[30px] border border-[#e5e7eb] bg-white text-[14px] font-semibold text-[#2e3b4c]"
              onClick={close}
              type="button"
            >
              Anuluj
            </button>
            <button
              className="flex flex-1 items-center justify-center rounded-[30px] border border-[#e6edf3] bg-[#0079de] text-[14px] font-semibold text-white disabled:cursor-wait disabled:opacity-70"
              disabled={isSaving}
              onClick={saveReview}
              type="button"
            >
              {isSaving ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>
        </div>
      </div>

      <button
        aria-label="Zamknij"
        className="absolute right-[calc(50%-330px)] top-[calc(50%-200px)] grid h-[35px] w-[35px] place-items-center rounded-[30px] border-0 bg-[rgba(46,59,76,0.7)] p-[5px] text-white max-md:right-4 max-md:top-4"
        onClick={close}
        type="button"
      >
        <X className="h-5 w-5" strokeWidth={2.2} />
      </button>
    </section>
  );
}
