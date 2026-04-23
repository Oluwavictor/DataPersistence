// import {
// 	Entity,
// 	PrimaryColumn,
// 	Column,
// 	CreateDateColumn,
// 	Index,
//   } from "typeorm";
  
//   @Entity("profiles")
//   export class Profile {
// 	@PrimaryColumn({ type: "varchar", length: 36 })
// 	id!: string;
  
// 	@Index("idx_profile_name", { unique: true })
// 	@Column({ type: "varchar", length: 255, collation: "utf8mb4_unicode_ci" })
// 	name!: string;
  
// 	@Index("idx_profile_gender")
// 	@Column({ type: "varchar", length: 10 })
// 	gender!: string;
  
// 	@Column({ type: "float" })
// 	gender_probability!: number;
  
// 	@Index("idx_profile_age")
// 	@Column({ type: "int", unsigned: true })
// 	age!: number;
  
// 	@Index("idx_profile_age_group")
// 	@Column({ type: "varchar", length: 20 })
// 	age_group!: string;
  
// 	@Index("idx_profile_country_id")
// 	@Column({ type: "varchar", length: 2 })
// 	country_id!: string;
  
// 	@Column({ type: "varchar", length: 100 })
// 	country_name!: string;
  
// 	@Column({ type: "float" })
// 	country_probability!: number;
  
// 	@Index("idx_profile_created_at")
// 	@CreateDateColumn({ type: "timestamp" })
// 	created_at!: Date;
//   }

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
  
	@Index("idx_profile_age")
	@Column({ type: "int", unsigned: true })
	age!: number;
  
	@Index("idx_profile_age_group")
	@Column({ type: "varchar", length: 20 })
	age_group!: string;
  
	@Index("idx_profile_country_id")
	@Column({ type: "char", length: 2, nullable: true })
	country_id!: string | null;
  
	@Column({ type: "varchar", length: 100, nullable: true })
	country_name!: string | null;
  
	@Column({ type: "decimal", precision: 5, scale: 4, nullable: true })
	country_probability!: number | null;
  
	@Index("idx_profile_created_at")
	@CreateDateColumn({ type: "timestamp" })
	created_at!: Date;
  }