import { Column, Entity, PrimaryColumn } from "typeorm";

type ReviewImage = {
  id: string;
  label: string;
};

@Entity({ name: "panel_reviews" })
export class PanelReviewEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ type: "varchar" })
  context!: "opinions" | "regulations" | "standards";

  @Column({ default: false })
  pending!: boolean;

  @Column()
  person!: string;

  @Column()
  service!: string;

  @Column({ nullable: true, type: "varchar" })
  author!: string | null;

  @Column({ type: "int", nullable: true })
  rating!: number | null;

  @Column({ nullable: true, type: "varchar" })
  date!: string | null;

  @Column({ type: "text", nullable: true })
  content!: string | null;

  @Column({ type: "simple-json", nullable: true })
  images!: ReviewImage[] | null;

  @Column({ type: "varchar" })
  avatarTone!: "person" | "brand" | "light";

  @Column({ default: false })
  editable!: boolean;

  @Column({ type: "int", default: 0 })
  orderIndex!: number;
}
