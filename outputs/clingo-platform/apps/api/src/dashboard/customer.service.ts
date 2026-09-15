import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { In, Repository } from "typeorm";
import type sharpFactory from "sharp";
const sharp: typeof sharpFactory = require("sharp");
import { UserEntity } from "../auth/user.entity";
import { objectInput } from "../auth/auth.service";
import { CustomerFavoriteEntity } from "./customer-favorite.entity";
import { CustomerReviewEntity, CustomerReviewImageEntity } from "./customer-review.entity";
import { OrderEntity } from "./order.entity";
import { ProviderProfileEntity } from "./provider-profile.entity";

// An elapsed date alone is not proof of completion. Cancellation always excludes reviewing.
function completed(order: OrderEntity) {
  return !/odwo|anul|cancel|niewykon/i.test(order.status) && /^(wykonane zlecenie|zakończone zlecenie|zakończone|wykonane|completed|done)$/i.test(order.status.trim());
}
function authorName(user: UserEntity) { return [user.firstName || "Klient", user.lastName ? `${user.lastName[0]}.` : ""].filter(Boolean).join(" "); }
function reviewDate(date: Date) { return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" }); }

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerFavoriteEntity) private readonly favorites: Repository<CustomerFavoriteEntity>,
    @InjectRepository(CustomerReviewEntity) private readonly reviews: Repository<CustomerReviewEntity>,
    @InjectRepository(CustomerReviewImageEntity) private readonly images: Repository<CustomerReviewImageEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(ProviderProfileEntity) private readonly providers: Repository<ProviderProfileEntity>
  ) {}

  async getFavorites(user: UserEntity) {
    const favorites = await this.favorites.find({ where: { userId: user.id }, relations: { provider: true }, order: { createdAt: "DESC" } });
    const ratings = await this.ratingTotals(favorites.map(item => item.providerId));
    return favorites.map(({ provider }) => ({ id: provider.id, name: provider.provider, completedServices: provider.completedOrders,
      ...this.rating(provider, ratings.get(provider.id)), experience: provider.experience }));
  }
  async setFavorite(user: UserEntity, providerId: string, enabled: boolean) {
    if (enabled) {
      if (!await this.providers.existsBy({ id: providerId })) throw new NotFoundException("Wykonawca nie jest dostępny.");
      await this.favorites.createQueryBuilder().insert().values({ userId: user.id, providerId }).orIgnore().execute();
    } else await this.favorites.delete({ userId: user.id, providerId });
    return { providerId, favorite: enabled };
  }

  async getOpinions(user: UserEntity) {
    const [orders, reviews] = await Promise.all([
      this.orders.find({ where: { userEmail: user.email }, order: { endsAt: "DESC" } }),
      this.reviews.find({ where: { userId: user.id }, relations: { order: true }, order: { updatedAt: "DESC" } })
    ]);
    const reviewed = new Set(reviews.map(review => review.orderId));
    return {
      pendingReviews: orders.filter(order => completed(order) && order.providerId && !reviewed.has(order.id)).map(order => ({ id: order.id, person: order.provider, service: order.serviceType, avatarTone: "person" as const })),
      userReviews: reviews.map(review => this.toCard(review, review.order))
    };
  }
  private toCard(review: CustomerReviewEntity, order: OrderEntity) {
    return { id: review.orderId, person: order.provider, service: order.serviceType, rating: review.rating, content: review.content,
      date: reviewDate(review.updatedAt), images: review.images, avatarTone: "person" as const, editable: true };
  }

  async saveReview(user: UserEntity, orderId: string, value: unknown) {
    const input = objectInput(value);
    if (typeof input.rating !== "number" || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new BadRequestException("Wybierz ocenę od 1 do 5.");
    if (typeof input.content !== "string" || !input.content.trim() || input.content.length > 1000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(input.content)) throw new BadRequestException("Opinia musi mieć od 1 do 1000 znaków.");
    if (!Array.isArray(input.images) || input.images.length > 3) throw new BadRequestException("Możesz dodać maksymalnie 3 zdjęcia.");
    const order = await this.orders.findOneBy({ id: orderId, userEmail: user.email });
    if (!order) throw new NotFoundException("Nie znaleziono zamówienia.");
    if (!completed(order) || !order.providerId) throw new BadRequestException("Opinię można wystawić tylko po zakończonej usłudze.");
    const prepared: Array<{ id: string; label: string; url: string; data?: Buffer }> = [];
    for (const [index, value] of input.images.entries()) {
      const image = objectInput(value);
      const label = `Zdjęcie efektów usługi ${index + 1}`;
      if (typeof image.dataUrl === "string") {
        if (image.dataUrl.length > 2 * 1024 * 1024 * 4 / 3 + 100) throw new BadRequestException("Każde zdjęcie może mieć do 2 MB.");
        const match = image.dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
        if (!match) throw new BadRequestException("Dozwolone zdjęcia: JPG, PNG i WebP.");
        let data: Buffer;
        try {
          const bytes = Buffer.from(match[2], "base64");
          if (bytes.length > 2 * 1024 * 1024) throw new Error("Too large");
          const source = sharp(bytes, { limitInputPixels: 16_000_000, animated: false });
          const metadata = await source.metadata();
          if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw new Error("Invalid image format");
          // Decode and re-encode to remove metadata, embedded payloads and original file names.
          data = await source.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
          if (data.length > 2 * 1024 * 1024) throw new Error("Too large");
        } catch { throw new BadRequestException("Nie można odczytać zdjęcia. Wybierz JPG, PNG lub WebP do 2 MB i 16 megapikseli."); }
        const id = randomUUID();
        prepared.push({ id, label, url: `/api/review-images/${id}`, data });
      } else {
        if (typeof image.id !== "string" || !/^[a-f0-9-]{36}$/.test(image.id) || prepared.some(item => item.id === image.id)) throw new BadRequestException("Nieprawidłowe zdjęcie.");
        prepared.push({ id: image.id, label, url: `/api/review-images/${image.id}` });
      }
    }
    return this.orders.manager.transaction(async manager => {
      const locked = await manager.findOne(OrderEntity, { where: { id: orderId, userEmail: user.email }, lock: { mode: "pessimistic_write" } });
      if (!locked || !completed(locked) || !locked.providerId) throw new BadRequestException("Usługa nie kwalifikuje się do oceny.");
      const old = await manager.findOneBy(CustomerReviewEntity, { orderId, userId: user.id });
      for (const image of prepared) if (!image.data && !old?.images.some(item => item.id === image.id)) throw new BadRequestException("Zdjęcie nie należy do tej opinii.");
      const review = await manager.save(CustomerReviewEntity, manager.create(CustomerReviewEntity, {
        ...(old ?? {}), orderId, userId: user.id, providerId: locked.providerId, rating: input.rating as number, content: (input.content as string).trim(),
        images: prepared.map(({ data, ...image }) => image)
      }));
      for (const image of prepared) if (image.data) await manager.insert(CustomerReviewImageEntity, { id: image.id, orderId, data: image.data });
      const removed = (old?.images ?? []).filter(image => !prepared.some(item => item.id === image.id));
      if (removed.length) await manager.delete(CustomerReviewImageEntity, { orderId, id: In(removed.map(image => image.id)) });
      return this.toCard(review, locked);
    });
  }

  async deleteReview(user: UserEntity, orderId: string) {
    const deleted = await this.reviews.delete({ orderId, userId: user.id });
    if (!deleted.affected) throw new NotFoundException("Nie znaleziono opinii.");
    return { message: "Usunięto opinię i jej zdjęcia." };
  }

  async reviewImage(id: string) {
    const image = await this.images.findOne({ where: { id }, select: { id: true, data: true } });
    if (!image) throw new NotFoundException("Nie znaleziono zdjęcia.");
    return image.data;
  }

  async ratingTotals(ids: string[]) {
    if (!ids.length) return new Map<string, { count: number; sum: number }>();
    const rows = await this.reviews.createQueryBuilder("r").select("r.providerId", "id").addSelect("COUNT(*)", "count").addSelect("SUM(r.rating)", "sum")
      .where("r.providerId IN (:...ids)", { ids }).groupBy("r.providerId").getRawMany();
    return new Map<string, { count: number; sum: number }>(rows.map(row => [row.id, { count: Number(row.count), sum: Number(row.sum) }]));
  }
  rating(provider: { rating: number; reviewsCount: number }, extra?: { count: number; sum: number }) {
    const count = provider.reviewsCount + (extra?.count ?? 0);
    return { rating: count ? Math.round((Number(provider.rating) * provider.reviewsCount + (extra?.sum ?? 0)) / count * 10) / 10 : 0, reviews: count };
  }
  async publicProfile(profile: ProviderProfileEntity) {
    const reviews = await this.reviews.find({ where: { providerId: profile.id }, relations: { user: true }, order: { createdAt: "DESC" } });
    const rating = this.rating(profile, { count: reviews.length, sum: reviews.reduce((sum, review) => sum + review.rating, 0) });
    const reviewsCount = rating.reviews;
    return { ...profile, rating: rating.rating, reviewsCount,
      metrics: profile.metrics.map(metric => metric.id === "rating" ? { ...metric, value: String(rating.rating) } : metric),
      overview: profile.overview?.map(metric => metric.id === "rating" ? { ...metric, value: String(rating.rating) } : metric.id === "reviews" ? { ...metric, value: String(reviewsCount) } : metric),
      reviews: [...reviews.map(review => ({ id: review.orderId, author: authorName(review.user), content: review.content, rating: review.rating, date: reviewDate(review.updatedAt), images: review.images })), ...profile.reviews] };
  }
}
