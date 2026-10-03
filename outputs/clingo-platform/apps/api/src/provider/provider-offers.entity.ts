import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProviderAccountEntity } from "./provider.entity";
import type { OfferConfiguration, OfferInput } from "./provider-offers.input";

@Entity("provider_offers")
@Index(["accountId"])
export class ProviderOfferEntity implements OfferInput {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @ManyToOne(() => ProviderAccountEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "account_id" }) account!: ProviderAccountEntity;
  @Column({ type: "varchar", length: 180 }) title!: string;
  @Column({ type: "varchar", length: 20 }) category!: string;
  @Column({ type: "varchar", length: 2000 }) description!: string;
  @Column({ name: "price_minor", type: "integer" }) priceMinor!: number;
  @Column({ name: "duration_minutes", type: "integer" }) durationMinutes!: number;
  @Column({ type: "jsonb", default: () => "'{}'::jsonb" }) configuration!: OfferConfiguration;
  @Column({ type: "varchar", length: 20, default: "draft" }) status!: "draft" | "archived";
  @Column({ type: "integer", default: 1 }) revision!: number;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
