import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { OrderEntity } from "./order.entity";

@Entity("booking_photos")
@Index("booking_photos_order_idx", ["orderId"])
export class BookingPhotoEntity {
  @PrimaryColumn({ type: "uuid" }) id!: string;
  @Column({ name: "order_id", type: "uuid" }) orderId!: string;
  @Column({ type: "bytea", select: false }) data!: Buffer;
  @ManyToOne(() => OrderEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "order_id" }) order!: OrderEntity;
}
