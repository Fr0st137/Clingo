import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProviderAccountEntity, ProviderEmployeeEntity } from "./provider.entity";
import { ProviderClientEntity } from "./provider-clients.entity";
import { ProviderOfferEntity } from "./provider-offers.entity";
@Entity("provider_jobs")
@Index(["accountId", "date"])
@Index("provider_jobs_multi_order_session_idx", ["multiOrderId", "sessionIndex"], { unique: true })
export class ProviderJobEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @ManyToOne(() => ProviderAccountEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "account_id" }) account!: ProviderAccountEntity;
  @Column({ name: "client_id", type: "uuid" }) clientId!: string;
  @ManyToOne(() => ProviderClientEntity, { onDelete: "RESTRICT" }) @JoinColumn({ name: "client_id" }) client!: ProviderClientEntity;
  @Column({ name: "offer_id", type: "uuid" }) offerId!: string;
  @ManyToOne(() => ProviderOfferEntity, { onDelete: "RESTRICT" }) @JoinColumn({ name: "offer_id" }) offer!: ProviderOfferEntity;
  @Column({ name: "employee_id", type: "uuid", nullable: true }) employeeId!: string | null;
  @ManyToOne(() => ProviderEmployeeEntity, { onDelete: "SET NULL", nullable: true }) @JoinColumn({ name: "employee_id" }) employee!: ProviderEmployeeEntity | null;
  @Column({ type: "date" }) date!: string;
  @Column({ name: "start_minute", type: "integer" }) startMinute!: number;
  @Column({ name: "duration_minutes", type: "integer" }) durationMinutes!: number;
  @Column({ name: "price_minor", type: "integer" }) priceMinor!: number;
  @Column({ type: "varchar", length: 20 }) status!: "scheduled" | "completed" | "cancelled";
  @Column({ type: "varchar", length: 2000 }) notes!: string;
  @Column({ name: "client_name", type: "varchar", length: 180 }) clientName!: string;
  @Column({ name: "client_phone", type: "varchar", length: 40 }) clientPhone!: string;
  @Column({ name: "client_email", type: "varchar", length: 320 }) clientEmail!: string;
  @Column({ type: "varchar", length: 420 }) address!: string;
  @Column({ name: "service_title", type: "varchar", length: 180 }) serviceTitle!: string;
  @Column({ name: "employee_name", type: "varchar", length: 180 }) employeeName!: string;
  @Column({ name: "multi_order_id", type: "uuid", nullable: true }) multiOrderId!: string | null;
  @Column({ name: "session_index", type: "integer", nullable: true }) sessionIndex!: number | null;
  @Column({ name: "session_count", type: "integer", nullable: true }) sessionCount!: number | null;
  @Column({ type: "integer", default: 1 }) revision!: number;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
