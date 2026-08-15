import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "board_listings" })
export class BoardListingEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  provider!: string;

  @Column({ type: "numeric", precision: 2, scale: 1 })
  rating!: number;

  @Column({ type: "int" })
  reviews!: number;

  @Column({ default: "" })
  experience!: string;

  @Column()
  price!: string;

  @Column({ type: "int" })
  completedOrders!: number;

  @Column()
  mode!: "Jednosesyjne" | "Wielosesyjne";

  @Column()
  modeTone!: "blue" | "gray";

  @Column()
  image!: string;

  @Column({ nullable: true, type: "varchar" })
  imageFit!: "cover" | "contain" | null;

  @Column({ nullable: true, type: "varchar" })
  imageScale!: string | null;

  @Column({ type: "int", default: 0 })
  orderIndex!: number;
}
