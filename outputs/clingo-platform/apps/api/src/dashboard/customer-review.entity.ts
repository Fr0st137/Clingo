import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "../auth/user.entity";
import { OrderEntity } from "./order.entity";
import { ProviderProfileEntity } from "./provider-profile.entity";

@Entity({ name: "customer_reviews" })
@Check("customer_review_rating", '"rating" BETWEEN 1 AND 5')
@Check("customer_review_content", 'char_length("content") BETWEEN 1 AND 1000')
export class CustomerReviewEntity {
  // Exactly one review per reservation, enforced by the database, including concurrent requests.
  @PrimaryColumn({ type: "uuid", name: "order_id" }) orderId!: string;
  @Index() @Column({ type: "uuid", name: "user_id" }) userId!: string;
  @Index() @Column({ name: "provider_id" }) providerId!: string;
  @Column({ type: "int" }) rating!: number;
  @Column({ type: "text" }) content!: string;
  @Column({ type: "jsonb", default: () => "'[]'::jsonb" }) images!: Array<{ id: string; label: string; url: string }>;
  @CreateDateColumn({ type: "timestamptz", name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" }) updatedAt!: Date;
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "user_id" }) user!: UserEntity;
  @ManyToOne(() => OrderEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "order_id" }) order!: OrderEntity;
  @ManyToOne(() => ProviderProfileEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "provider_id" }) provider!: ProviderProfileEntity;
}

@Entity({ name: "customer_review_images" })
export class CustomerReviewImageEntity {
  @PrimaryColumn({ type: "uuid" }) id!: string;
  @Index() @Column({ type: "uuid", name: "order_id" }) orderId!: string;
  @Column({ type: "bytea", select: false }) data!: Buffer;
  @ManyToOne(() => CustomerReviewEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "order_id" }) review!: CustomerReviewEntity;
}
