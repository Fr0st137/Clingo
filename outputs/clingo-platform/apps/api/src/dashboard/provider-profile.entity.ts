import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ProviderAccountEntity } from "../provider/provider.entity";

@Entity({ name: "provider_profiles" })
export class ProviderProfileEntity {
  // Computed from the current roster for public reads; never persisted.
  staffingValid?: boolean;
  @Column({ type: "boolean", default: true })
  published!: boolean;

  @Column({ name: "area_pricing", type: "simple-json", nullable: true })
  areaPricing!: import("./area-pricing").AreaPricing | null;

  // Set only by an administrator after verifying the public profile's owner.
  @Index("provider_profiles_account_idx")
  @Column({ name: "account_id", type: "uuid", nullable: true })
  accountId!: string | null;

  @ManyToOne(() => ProviderAccountEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "account_id", foreignKeyConstraintName: "provider_profiles_account_fk" })
  account!: ProviderAccountEntity | null;

  @Column({ nullable: true, type: "simple-json", name: "booking_settings" })
  bookingSettings!: import("./booking").WorkingHours | null;

  @PrimaryColumn()
  id!: string;

  @Column()
  provider!: string;

  @Column({ default: true })
  verified!: boolean;

  @Column()
  service!: string;

  @Column()
  location!: string;

  @Column({ type: "numeric", precision: 2, scale: 1 })
  rating!: number;

  @Column({ type: "int" })
  reviewsCount!: number;

  @Column()
  experience!: string;

  @Column({ type: "int" })
  completedOrders!: number;

  @Column()
  priceFrom!: string;

  @Column({ type: "simple-json" })
  tags!: string[];

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "simple-json" })
  metrics!: Array<{ id: string; label: string; value: string }>;

  @Column({ type: "simple-json" })
  gallery!: Array<{ gradient: string; id: string; label: string }>;

  @Column({ nullable: true, type: "simple-json" })
  overview?: Array<{ id: string; label: string; value: string }> | null;

  @Column({ nullable: true, type: "simple-json" })
  photos?: Array<{ gradient: string; id: string; image?: string; label: string }> | null;

  @Column({ nullable: true, type: "simple-json" })
  pricing?: Array<{ description: string; duration: string; id: string; label: string; price: string; priceValue: number }> | null;

  @Column({ nullable: true, type: "simple-json" })
  frequencies?: Array<{ description: string; discount: string; id: string; label: string }> | null;

  @Column({ nullable: true, type: "simple-json" })
  addOns?: Array<{
    description: string;
    durationMinutes: number;
    id: string;
    label: string;
    price: string;
    priceValue: number;
    selected?: boolean;
  }> | null;

  @Column({ type: "simple-json" })
  reviews!: Array<{ author: string; content: string; date: string; id: string; rating: number }>;

  @Column({ type: "simple-json" })
  standards!: string[];

  @Column({ type: "simple-json" })
  summary!: {
    duration: string;
    lines: Array<{ id: string; label: string; value: string }>;
    total: string;
  };
}
