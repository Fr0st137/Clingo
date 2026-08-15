import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "chat_contacts" })
export class ChatContactEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  preview!: string;

  @Column()
  timeAgo!: string;

  @Column({ type: "int", default: 0 })
  orderIndex!: number;
}
