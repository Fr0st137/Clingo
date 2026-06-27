import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

type GeoPoint = {
  type: "Point";
  coordinates: [number, number];
};

@Entity({ name: "orders" })
export class OrderEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  provider!: string;

  @Column()
  status!: string;

  @Column()
  mode!: string;

  @Column()
  serviceType!: string;

  @Column()
  address!: string;

  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true
  })
  location!: GeoPoint | null;

  @Column({ type: "timestamptz", nullable: true })
  startsAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  endsAt!: Date | null;
}
