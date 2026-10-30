import { BadRequestException } from "@nestjs/common";
import { objectInput } from "../auth/auth.service";
import { MAX_PROJECT_NOTES, MAX_PROJECT_PHOTOS, type ProjectNote } from "./project-notes.types";
import type sharpFactory from "sharp";
const sharp: typeof sharpFactory = require("sharp");
const uuid = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export function projectNotesInput(notes: unknown, photos: unknown) {
  if (!Array.isArray(notes) || notes.length > MAX_PROJECT_NOTES || !Array.isArray(photos) || photos.length > MAX_PROJECT_PHOTOS) throw new BadRequestException("Możesz dodać maksymalnie 20 notatek i 10 zdjęć.");
  const noteIds = new Set<string>(), photoIds = new Set<string>();
  const noteItems: ProjectNote[] = notes.map(value => {
    const row = objectInput(value);
    if (Object.keys(row).some(key => !["id", "title", "body"].includes(key)) || !uuid(row.id) || noteIds.has(row.id.toLowerCase()) || typeof row.title !== "string" || !row.title.trim() || row.title.length > 100 || /[\x00-\x1f\x7f]/.test(row.title) || typeof row.body !== "string" || !row.body.trim() || row.body.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(row.body)) throw new BadRequestException("Podaj unikalną notatkę, tytuł do 100 znaków i treść do 2000 znaków.");
    const id = row.id.toLowerCase(); noteIds.add(id); return { id, title: row.title.trim(), body: row.body.trim() };
  });
  const images = photos.map(value => {
    const row = objectInput(value);
    if (Object.keys(row).some(key => !["id", "dataUrl"].includes(key)) || !uuid(row.id) || photoIds.has(row.id.toLowerCase())) throw new BadRequestException("Nieprawidłowe lub powtórzone zdjęcie.");
    const id = row.id.toLowerCase(); photoIds.add(id);
    if (row.dataUrl !== undefined && (typeof row.dataUrl !== "string" || row.dataUrl.length > 220000 || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(row.dataUrl))) throw new BadRequestException("Wybierz poprawne zdjęcie JPG, PNG lub WebP.");
    return { id, ...(row.dataUrl === undefined ? {} : { dataUrl: row.dataUrl as string }) };
  });
  return { noteItems, photos: images };
}
export async function prepareProjectPhotos(photos: ReturnType<typeof projectNotesInput>["photos"]) {
  const result: Array<{ id: string; data?: Buffer }> = [];
  for (const photo of photos) {
    if (!photo.dataUrl) { result.push({ id: photo.id }); continue; }
    try {
      const source = sharp(Buffer.from(photo.dataUrl.split(",")[1], "base64"), { limitInputPixels: 16_000_000, animated: false });
      const metadata = await source.metadata();
      if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw Error("Invalid photo");
      const data = await source.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      if (data.length > 2 * 1024 * 1024) throw Error("Photo too large");
      result.push({ id: photo.id, data });
    } catch { throw new BadRequestException("Nie można odczytać zdjęcia. Dodaj poprawny plik JPG, PNG lub WebP."); }
  }
  return result;
}
