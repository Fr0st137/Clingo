import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "notification_settings" })
export class NotificationSettingEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: "int", default: 0 })
  orderIndex!: number;
}
