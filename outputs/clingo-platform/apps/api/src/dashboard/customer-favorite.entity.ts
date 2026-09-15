import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { UserEntity } from "../auth/user.entity";
import { ProviderProfileEntity } from "./provider-profile.entity";

@Entity({ name: "customer_favorites" })
export class CustomerFavoriteEntity {
  @PrimaryColumn({ type: "uuid", name: "user_id" }) userId!: string;
  @PrimaryColumn({ name: "provider_id" }) providerId!: string;
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "user_id" }) user!: UserEntity;
  @ManyToOne(() => ProviderProfileEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "provider_id" }) provider!: ProviderProfileEntity;
  @CreateDateColumn({ type: "timestamptz", name: "created_at" }) createdAt!: Date;
}
