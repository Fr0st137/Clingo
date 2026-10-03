import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProviderClientEntity } from "./provider-clients.entity";
import { ProviderOfferEntity } from "./provider-offers.entity";
import { ProviderAccountEntity } from "./provider.entity";

export type ProviderMultiOrderSession = { date: string; startMinute: number; durationMinutes: number; employeeId: string | null };

@Entity("provider_multi_orders")
@Index("provider_multi_orders_account_start_idx", ["accountId", "startDate"])
@Check("provider_multi_order_status", '"status" IN (\'pending\', \'accepted\', \'rejected\')')
export class ProviderMultiOrderEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @ManyToOne(() => ProviderAccountEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "account_id" }) account!: ProviderAccountEntity;
  @Column({ name: "client_id", type: "uuid" }) clientId!: string;
  @ManyToOne(() => ProviderClientEntity, { onDelete: "RESTRICT" }) @JoinColumn({ name: "client_id" }) client!: ProviderClientEntity;
  @Column({ name: "offer_id", type: "uuid" }) offerId!: string;
  @ManyToOne(() => ProviderOfferEntity, { onDelete: "RESTRICT" }) @JoinColumn({ name: "offer_id" }) offer!: ProviderOfferEntity;
  @Column({ name: "client_name", type: "varchar", length: 180 }) clientName!: string;
  @Column({ name: "service_title", type: "varchar", length: 180 }) serviceTitle!: string;
  @Column({ name: "service_detail", type: "varchar", length: 180 }) serviceDetail!: string;
  @Column({ name: "start_date", type: "date" }) startDate!: string;
  @Column({ name: "end_date", type: "date" }) endDate!: string;
  @Column({ name: "area_square_meters", type: "integer" }) areaSquareMeters!: number;
  @Column({ name: "add_on_count", type: "integer", default: 0 }) addOnCount!: number;
  @Column({ name: "total_price_minor", type: "integer" }) totalPriceMinor!: number;
  @Column({ type: "boolean", default: false }) external!: boolean;
  @Column({ type: "varchar", length: 20, default: "pending" }) status!: "pending" | "accepted" | "rejected";
  @Column({ type: "jsonb" }) sessions!: ProviderMultiOrderSession[];
  @Column({ type: "varchar", length: 2000, default: "" }) notes!: string;
  @Column({ type: "integer", default: 1 }) revision!: number;
  @Column({ name: "accepted_at", type: "timestamptz", nullable: true }) acceptedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
