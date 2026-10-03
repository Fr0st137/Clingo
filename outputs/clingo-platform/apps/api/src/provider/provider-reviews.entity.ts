import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProviderAccountEntity } from "./provider.entity";

@Entity("provider_reviews")
@Index("provider_reviews_account_created_idx", ["accountId", "createdAt"])
@Check("provider_review_rating", '"rating" BETWEEN 1 AND 5')
@Check("provider_review_helpful_count", '"helpful_count" >= 0')
export class ProviderReviewEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @ManyToOne(() => ProviderAccountEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "account_id" }) account!: ProviderAccountEntity;
  @Column({ name: "author_name", type: "varchar", length: 180 }) authorName!: string;
  @Column({ name: "service_title", type: "varchar", length: 180 }) serviceTitle!: string;
  @Column({ type: "smallint" }) rating!: number;
  @Column({ type: "varchar", length: 2000 }) content!: string;
  @Column({ name: "helpful_count", type: "integer", default: 0 }) helpfulCount!: number;
  @Column({ type: "boolean", default: false }) reported!: boolean;
  @Column({ type: "integer", default: 1 }) revision!: number;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
