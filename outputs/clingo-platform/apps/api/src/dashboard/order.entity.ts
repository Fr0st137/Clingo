import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

type GeoPoint = {
  type: "Point";
  coordinates: [number, number];
};

@Entity({ name: "orders" })
export class OrderEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ length: 320, name: "user_email", nullable: true, type: "varchar" })
  userEmail!: string | null;

  @Column({ name: "provider_id", nullable: true, type: "varchar" })
  providerId!: string | null;

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

  @Column({ nullable: true, type: "simple-json" })
  summary!: {
    duration: string;
    lines: Array<{ id: string; label: string; value: string }>;
    total: string;
  } | null;

  @Column({ name: "selected_options", nullable: true, type: "simple-json" })
  selectedOptions!: {
    addOns: Array<{ id: string; label: string; quantity: number }>;
    frequencyId: string;
    pricingId: string;
    frequencyLabel?: string;
    contactName?: string;
    contactPhone?: string;
    apartment?: string;
    notes?: string;
    invoice?: { companyName: string; taxId: string; address: string } | null;
    requestId?: string;
    requestHash?: string;
  } | null;
}
