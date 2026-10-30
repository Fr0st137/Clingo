import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ProviderAccountEntity } from "./provider.entity";
import { ProviderMultiOrderEntity } from "./provider-multi-orders.entity";
@Entity("provider_project_photos")
@Index("provider_project_photos_project_idx", ["accountId", "projectId"])
export class ProviderProjectPhotoEntity {
  @PrimaryColumn({ type: "uuid" }) id!: string;
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @Column({ name: "project_id", type: "uuid" }) projectId!: string;
  @Column({ type: "integer" }) position!: number;
  @Column({ type: "bytea", select: false }) data!: Buffer;
  @ManyToOne(() => ProviderAccountEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "account_id" }) account!: ProviderAccountEntity;
  @ManyToOne(() => ProviderMultiOrderEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "project_id" }) project!: ProviderMultiOrderEntity;
}
