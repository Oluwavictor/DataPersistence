import {
	Entity,
	PrimaryColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	OneToMany,
  } from "typeorm";
  import { RefreshToken } from "./RefreshToken";
  
  export type UserRole = "admin" | "analyst";
  
  @Entity("users")
  export class User {
	@PrimaryColumn({ type: "varchar", length: 36 })
	id!: string;
  
	@Index("idx_user_github_id", { unique: true })
	@Column({ type: "varchar", length: 50 })
	github_id!: string;
  
	@Column({ type: "varchar", length: 100 })
	username!: string;
  
	@Column({ type: "varchar", length: 255, nullable: true })
	email!: string | null;
  
	@Column({ type: "varchar", length: 500, nullable: true })
	avatar_url!: string | null;
  
	@Column({ type: "varchar", length: 20, default: "analyst" })
	role!: UserRole;
  
	@Column({ type: "boolean", default: true })
	is_active!: boolean;
  
	@Column({ type: "timestamp", nullable: true })
	last_login_at!: Date | null;
  
	@CreateDateColumn({ type: "timestamp" })
	created_at!: Date;
  
	@UpdateDateColumn({ type: "timestamp" })
	updated_at!: Date;
  
	@OneToMany(() => RefreshToken, (token) => token.user)
	refresh_tokens!: RefreshToken[];
  }