import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderMembershipEntity } from "./provider.entity";
import { reviewReportInput } from "./provider-reviews.input";
import { ProviderReviewEntity } from "./provider-reviews.entity";

const reviewView = (row: ProviderReviewEntity) => ({ id: row.id, authorName: row.authorName, serviceTitle: row.serviceTitle, rating: row.rating, content: row.content, helpfulCount: row.helpfulCount, reported: row.reported, revision: row.revision, createdAt: row.createdAt.toISOString() });

@Injectable()
export class ProviderReviewsService {
  constructor(private readonly auth: AuthService,
    @InjectRepository(ProviderMembershipEntity) private readonly memberships: Repository<ProviderMembershipEntity>,
    @InjectRepository(ProviderReviewEntity) private readonly reviews: Repository<ProviderReviewEntity>) {}

  private async membership(authorization?: string) {
    const user = await this.auth.sessionUser(authorization);
    const membership = await this.memberships.findOneBy({ userId: user.id });
    if (!membership) throw new ForbiddenException("Brak dostępu do opinii działalności.");
    return membership;
  }

  async list(authorization?: string) {
    const membership = await this.membership(authorization);
    return (await this.reviews.find({ where: { accountId: membership.accountId }, order: { createdAt: "DESC", id: "ASC" } })).map(reviewView);
  }

  async report(authorization: string | undefined, id: string, value: unknown) {
    const membership = await this.membership(authorization);
    if (!(["owner", "admin"] as string[]).includes(membership.role)) throw new ForbiddenException("Brak uprawnień do zgłaszania opinii.");
    const input = reviewReportInput(value);
    const existing = await this.reviews.findOneBy({ id, accountId: membership.accountId });
    if (!existing) throw new NotFoundException("Nie znaleziono opinii.");
    const nextRevision = input.revision + 1;
    const result = await this.reviews.update({ id, accountId: membership.accountId, revision: input.revision }, { reported: input.reported, revision: nextRevision });
    if (result.affected !== 1) throw new ConflictException("Stan opinii zmienił się w innym oknie. Odśwież listę.");
    return reviewView({ ...existing, reported: input.reported, revision: nextRevision });
  }
}
