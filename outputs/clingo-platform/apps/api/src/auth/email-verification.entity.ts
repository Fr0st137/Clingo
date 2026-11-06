import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { UserEntity } from "./user.entity";
@Entity("email_verifications")
export class EmailVerificationEntity {
  @PrimaryColumn({ name: "token_hash", type: "varchar", length: 64 }) tokenHash!: string;
  @Index({ unique: true }) @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ name: "code_hash", type: "varchar", length: 64 }) codeHash!: string;
  @Column({ type: "integer", default: 0 }) attempts!: number;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date;
  @Column({ name: "resend_at", type: "timestamptz" }) resendAt!: Date;
  @Column({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "user_id" }) user!: UserEntity;
}
