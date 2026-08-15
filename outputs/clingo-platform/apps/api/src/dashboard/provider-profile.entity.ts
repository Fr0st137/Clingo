import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "provider_profiles" })
export class ProviderProfileEntity {
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
