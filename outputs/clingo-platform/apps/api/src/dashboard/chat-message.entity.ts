import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "chat_messages" })
export class ChatMessageEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  side!: "mine" | "theirs";

  @Column({ type: "text" })
  text!: string;

  @Column({ type: "int", default: 0 })
  orderIndex!: number;
}
