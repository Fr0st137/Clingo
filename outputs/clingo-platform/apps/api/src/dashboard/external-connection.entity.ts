import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "external_connections" })
export class ExternalConnectionEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  provider!: string;

  @Column()
  icon!: string;

  @Column({ type: "int", default: 0 })
  orderIndex!: number;
}
