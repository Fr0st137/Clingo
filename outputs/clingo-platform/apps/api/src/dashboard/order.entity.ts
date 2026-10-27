import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

type GeoPoint = {
  type: "Point";
  coordinates: [number, number];
};

@Entity({ name: "orders" })
export class OrderEntity {
  @Column({ type: "integer", default: 1 })
  revision!: number;

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
    estimatedWorkers?: number;
    serviceCategory?: string;
    employees?: Array<{ id: string; name: string }>;
    projectEstimate?: import("../provider/project-work").ProjectEstimate;
    projectCompletion?: import("../provider/project-completion").ProjectCompletion;
    projectHistory?: Array<{ at: string; actor: string; added: string[]; removed: string[]; changed: string[]; areaChanged: boolean; confirmedShortage: boolean; confirmedExcess: boolean }>;
    contactName?: string;
    contactPhone?: string;
    apartment?: string;
    notes?: string;
    invoice?: { companyName: string; taxId: string; address: string } | null;
    sessions?: Array<{ id?: string; startsAt: string; endsAt: string; workers: number; employees?: Array<{ id: string; name: string }>; priceMinor?: number }>;
    requestId?: string;
    requestHash?: string;
    providerMessages?: Array<{ type: "cancelled" | "rescheduled"; message: string; createdAt: string }>;
  } | null;
}
