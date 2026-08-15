import { Column, Entity, PrimaryColumn } from "typeorm";

type SettingsField = {
  id: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
  value: string;
};

@Entity({ name: "settings_sections" })
export class SettingsSectionEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ type: "simple-json", nullable: true })
  fields!: SettingsField[] | null;

  @Column({ nullable: true, type: "varchar" })
  actionLabel!: string | null;

  @Column({ type: "int", default: 0 })
  orderIndex!: number;
}
