import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProviderAccountEntity } from "./provider.entity";
import type { ClientInput } from "./provider-clients.input";

@Entity("provider_clients")
@Index(["accountId"])
export class ProviderClientEntity implements ClientInput {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @ManyToOne(() => ProviderAccountEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "account_id" }) account!: ProviderAccountEntity;
  @Column({ type: "varchar", length: 180 }) name!: string;
  @Column({ type: "varchar", length: 320 }) email!: string;
  @Column({ type: "varchar", length: 40 }) phone!: string;
  @Column({ type: "varchar", length: 240 }) street!: string;
  @Column({ name: "postal_code", type: "varchar", length: 20 }) postalCode!: string;
  @Column({ type: "varchar", length: 120 }) city!: string;
  @Column({ type: "varchar", length: 2000 }) notes!: string;
  @Column({ type: "integer", default: 1 }) revision!: number;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
