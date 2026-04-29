import {
	Entity,
	PrimaryColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
  } from "typeorm";
  import { User } from "./User";
  
  @Entity("refresh_tokens")
  export class RefreshToken {
	@PrimaryColumn({ type: "varchar", length: 36 })
	id!: string;
  
	@Index("idx_refresh_token_hash", { unique: true })
	@Column({ type: "varchar", length: 500 })
	token_hash!: string;
  
	@Column({ type: "varchar", length: 36 })
	user_id!: string;
  
	@Column({ type: "timestamp" })
	expires_at!: Date;
  
	@Column({ type: "boolean", default: false })
	is_revoked!: boolean;
  
	@CreateDateColumn({ type: "timestamp" })
	created_at!: Date;
  
	@ManyToOne(() => User, (user) => user.refresh_tokens, {
	  onDelete: "CASCADE",
	})
	@JoinColumn({ name: "user_id" })
	user!: User;
  }