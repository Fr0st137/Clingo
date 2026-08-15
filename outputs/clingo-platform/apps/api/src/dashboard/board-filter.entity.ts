import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "board_filters" })
export class BoardFilterEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "simple-json" })
  options!: string[];

  @Column({ type: "int", default: 0 })
  orderIndex!: number;
}
