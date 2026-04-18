import {
	Entity,
	PrimaryColumn,
	Column,
	CreateDateColumn,
	Index,
  } from "typeorm";
  
  @Entity("profiles")
  export class Profile {
	@PrimaryColumn({ type: "varchar", length: 36 })
	id!: string;
  
	@Index("idx_profile_name", { unique: true })
	@Column({ type: "varchar", length: 255, collation: "utf8mb4_unicode_ci" })
	name!: string;
  
	@Index("idx_profile_gender")
	@Column({ type: "varchar", length: 50 })
	gender!: string;
  
	@Column({ type: "decimal", precision: 5, scale: 4 })
	gender_probability!: number;
  
	@Column({ type: "int", unsigned: true })
	sample_size!: number;
  
	@Column({ type: "tinyint", unsigned: true })
	age!: number;
  
	@Index("idx_profile_age_group")
	@Column({ type: "enum", enum: ["child", "teenager", "adult", "senior"] })
	age_group!: string;
  
	@Index("idx_profile_country")
	@Column({ type: "char", length: 2, nullable: true })
	country_id!: string | null;
  
	@Column({ type: "decimal", precision: 5, scale: 4, nullable: true })
	country_probability!: number | null;
  
	@Index("idx_profile_created_at")
	@CreateDateColumn({ type: "timestamp" })
	created_at!: Date;
  }