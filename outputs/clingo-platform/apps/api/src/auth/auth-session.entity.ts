import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "auth_sessions" })
export class AuthSessionEntity {
  @PrimaryColumn({ length: 64 })
  tokenHash!: string;

  @Column()
  email!: string;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;
}
