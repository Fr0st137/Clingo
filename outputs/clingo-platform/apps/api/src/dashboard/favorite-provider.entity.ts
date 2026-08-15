import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "favorite_providers" })
export class FavoriteProviderEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "int" })
  completedServices!: number;

  @Column({ type: "numeric", precision: 2, scale: 1 })
  rating!: number;

  @Column({ type: "int" })
  reviews!: number;

  @Column()
  experience!: string;
}
