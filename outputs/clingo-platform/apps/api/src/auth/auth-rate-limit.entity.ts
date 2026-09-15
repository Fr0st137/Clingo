import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "auth_rate_limits" })
export class AuthRateLimitEntity {
  @PrimaryColumn({ length: 64 }) key!: string;
  @Column({ type: "int" }) count!: number;
  @Index() @Column({ type: "timestamptz" }) resetsAt!: Date;
}
