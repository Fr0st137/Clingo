import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "../auth/user.entity";
import type { EmployeeInput } from "./provider.input";
import type { ProviderNotifications } from "./provider-settings.input";
import type { ProviderLocation } from "./provider-location.input";

@Entity("provider_accounts")
export class ProviderAccountEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 180 }) name!: string;
  @Column({ name: "legal_name", type: "varchar", length: 180, default: "" }) legalName!: string;
  @Column({ type: "varchar", length: 40, default: "" }) phone!: string;
  @Column({ name: "contact_name", type: "varchar", length: 180, default: "" }) contactName!: string;
  @Column({ name: "contact_phone", type: "varchar", length: 40, default: "" }) contactPhone!: string;
  @Column({ name: "contact_email", type: "varchar", length: 320, default: "" }) contactEmail!: string;
  @Column({ name: "profile_revision", type: "integer", default: 1 }) profileRevision!: number;
  @Column({ type: "jsonb", default: () => "'{\"email\":{\"created\":false,\"changed\":false,\"cancelled\":false,\"marketing\":false},\"sms\":{\"created\":false,\"changed\":false,\"cancelled\":false,\"marketing\":false}}'::jsonb" }) notifications!: ProviderNotifications;
  @Column({ name: "notifications_revision", type: "integer", default: 1 }) notificationsRevision!: number;
  @Column({ type: "jsonb", default: () => "'{\"street\":\"\",\"postalCode\":\"\",\"city\":\"\",\"radiusKm\":0}'::jsonb" }) location!: ProviderLocation;
  @Column({ name: "location_revision", type: "integer", default: 1 }) locationRevision!: number;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}

@Entity("provider_memberships")
export class ProviderMembershipEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  // The first release supports one organisation per login.
  @Index({ unique: true })
  @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @Column({ type: "varchar", length: 20 }) role!: "owner" | "admin" | "employee";
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "user_id" }) user!: UserEntity;
  @ManyToOne(() => ProviderAccountEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "account_id" }) account!: ProviderAccountEntity;
}

@Entity("provider_employees")
@Index(["accountId"])
export class ProviderEmployeeEntity implements EmployeeInput {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @ManyToOne(() => ProviderAccountEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "account_id" }) account!: ProviderAccountEntity;
  @Column({ type: "varchar", length: 180 }) name!: string;
  @Column({ type: "varchar", length: 320 }) email!: string;
  @Column({ type: "varchar", length: 40 }) phone!: string;
  @Column({ name: "show_in_calendar", type: "boolean", default: true }) showInCalendar!: boolean;
  @Column({ type: "jsonb" }) services!: EmployeeInput["services"];
  @Column({ type: "jsonb" }) schedule!: EmployeeInput["schedule"];
  @Column({ type: "integer", default: 1 }) revision!: number;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
