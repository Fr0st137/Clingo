import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { ProviderMembershipEntity } from "./provider.entity";
import { reviewReportInput } from "./provider-reviews.input";
import { ProviderReviewEntity } from "./provider-reviews.entity";
import { OrderEntity } from "../dashboard/order.entity";
import { CustomerReviewEntity } from "../dashboard/customer-review.entity";
import { ACCOUNT_REVIEWS_SQL, ACCOUNT_REVIEW_SUMMARY_SQL, CUSTOMER_REVIEW_FOR_ACCOUNT_SQL, providerReviewView, type AccountReviewRow } from "../dashboard/review-bridge";

const reviewView = (row: ProviderReviewEntity) => ({ id: row.id, source:"legacy" as const,authorName: row.authorName, serviceTitle: row.serviceTitle, rating: row.rating, content: row.content, helpfulCount: row.helpfulCount, reported: row.reported, revision: row.revision, createdAt: row.createdAt.toISOString(),updatedAt:row.createdAt.toISOString(),images:[] });

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
    const rows:AccountReviewRow[]=await this.reviews.manager.query(ACCOUNT_REVIEWS_SQL,[membership.accountId]);
    return rows.map(providerReviewView);
  }

  async summary(authorization?: string) {
    const membership = await this.membership(authorization);
    const [result] = await this.reviews.manager.query(ACCOUNT_REVIEW_SUMMARY_SQL,[membership.accountId]);
    const count = Number(result?.count ?? 0);
    return { average: count ? Number(result?.average) : null, count };
  }

  async report(authorization: string | undefined, id: string, value: unknown) {
    const membership = await this.membership(authorization);
    if (!(["owner", "admin"] as string[]).includes(membership.role)) throw new ForbiddenException("Brak uprawnień do zgłaszania opinii.");
    const input = reviewReportInput(value);
    if(input.source==="customer")return this.reviews.manager.transaction(async manager=>{
      const scoped:AccountReviewRow[]=await manager.query(CUSTOMER_REVIEW_FOR_ACCOUNT_SQL,[membership.accountId,id]);
      if(!scoped.length)throw new NotFoundException("Nie znaleziono opinii.");
      await manager.findOneOrFail(OrderEntity,{where:{id},lock:{mode:"pessimistic_write"}});
      const [current]:AccountReviewRow[]=await manager.query(CUSTOMER_REVIEW_FOR_ACCOUNT_SQL,[membership.accountId,id]);
      if(!current)throw new NotFoundException("Nie znaleziono opinii.");
      if(current.revision!==input.revision||new Date(current.updated_at).toISOString()!==input.updatedAt)throw new ConflictException("Opinia zmieniła się. Wczytaj aktualne dane przed zgłoszeniem.");
      const result=await manager.update(CustomerReviewEntity,{orderId:id,revision:input.revision},{providerReported:input.reported,revision:input.revision+1,updatedAt:new Date(current.updated_at)});
      if(result.affected!==1)throw new ConflictException("Opinia zmieniła się. Wczytaj aktualne dane.");
      return providerReviewView({...current,reported:input.reported,revision:input.revision+1});
    });
    const existing = await this.reviews.findOneBy({ id, accountId: membership.accountId });
    if (!existing) throw new NotFoundException("Nie znaleziono opinii.");
    const nextRevision = input.revision + 1;
    const result = await this.reviews.update({ id, accountId: membership.accountId, revision: input.revision }, { reported: input.reported, revision: nextRevision });
    if (result.affected !== 1) throw new ConflictException("Stan opinii zmienił się w innym oknie. Odśwież listę.");
    return reviewView({ ...existing, reported: input.reported, revision: nextRevision });
  }

  async image(authorization:string|undefined,orderId:string,imageId:string) {
    const membership=await this.membership(authorization);
    const [image]=await this.reviews.manager.query(`SELECT i.data FROM customer_review_images i JOIN customer_reviews r ON r.order_id=i.order_id JOIN provider_profiles p ON p.id=r.provider_id WHERE i.id=$1 AND i.order_id=$2 AND p.account_id=$3`,[imageId,orderId,membership.accountId]);
    if(!image)throw new NotFoundException("Nie znaleziono zdjęcia opinii.");
    return image.data as Buffer;
  }
}
