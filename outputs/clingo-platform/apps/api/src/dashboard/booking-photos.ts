import { BadRequestException, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { EntityManager } from "typeorm";
import type sharpFactory from "sharp";
import { BookingPhotoEntity } from "./booking-photo.entity";
import { MAX_BOOKING_PHOTOS, MAX_BOOKING_PHOTO_DATA_URL } from "./booking-photo.types";
const sharp: typeof sharpFactory = require("sharp");

export async function prepareBookingPhotos(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_BOOKING_PHOTOS) throw new BadRequestException("Możesz dodać maksymalnie 10 zdjęć.");
  const result: Array<{ id: string; label: string; data: Buffer }> = [];
  for (const [index, row] of value.entries()) {
    if (!row || typeof row !== "object" || Object.keys(row).some(key => key !== "dataUrl") || typeof row.dataUrl !== "string" || row.dataUrl.length > MAX_BOOKING_PHOTO_DATA_URL || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(row.dataUrl)) throw new BadRequestException("Dodaj poprawne zdjęcie JPG, PNG lub WebP.");
    try {
      const image = sharp(Buffer.from(row.dataUrl.split(",")[1], "base64"), { limitInputPixels: 16_000_000, animated: false });
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw Error("Invalid image");
      const data = await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      if (data.length > 2 * 1024 * 1024) throw Error("Image too large");
      result.push({ id: randomUUID(), label: `Zdjęcie obszaru objętego usługą ${index + 1}`, data });
    } catch { throw new BadRequestException("Nie można odczytać zdjęcia. Wybierz poprawny plik JPG, PNG lub WebP."); }
  }
  return result;
}

// Call only after checking access to the order; a photo ID alone never grants access.
export async function bookingPhoto(manager: EntityManager, orderId: string, id: string) {
  const row = await manager.createQueryBuilder(BookingPhotoEntity, "photo").addSelect("photo.data").where("photo.id = :id AND photo.order_id = :orderId", { id, orderId }).getOne();
  if (!row) throw new NotFoundException("Nie znaleziono zdjęcia.");
  return row.data;
}
