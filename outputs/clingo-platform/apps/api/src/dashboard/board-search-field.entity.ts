import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "board_search_fields" })
export class BoardSearchFieldEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  label!: string;

  @Column()
  value!: string;

  @Column({ type: "int", default: 0 })
  orderIndex!: number;
}
