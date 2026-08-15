import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ length: 320, type: "varchar" })
  email!: string;

  @Column({ length: 128, name: "password_hash", type: "varchar" })
  passwordHash!: string;

  @Column({ length: 64, name: "password_salt", type: "varchar" })
  passwordSalt!: string;

  @Column({ length: 40, nullable: true, type: "varchar" })
  phone!: string | null;

  @Column({ length: 120, name: "first_name", nullable: true, type: "varchar" })
  firstName!: string | null;

  @Column({ length: 120, name: "last_name", nullable: true, type: "varchar" })
  lastName!: string | null;

  @Column({ length: 180, name: "company_name", nullable: true, type: "varchar" })
  companyName!: string | null;

  @Column({ length: 180, nullable: true, type: "varchar" })
  street!: string | null;

  @Column({ length: 40, nullable: true, type: "varchar" })
  apartment!: string | null;

  @Column({ length: 120, nullable: true, type: "varchar" })
  city!: string | null;

  @Column({ length: 20, name: "postal_code", nullable: true, type: "varchar" })
  postalCode!: string | null;

  @Column({ default: false, name: "email_verified", type: "boolean" })
  emailVerified!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
