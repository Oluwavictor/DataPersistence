import {
	IsOptional,
	IsString,
	IsIn,
	IsNumberString,
  } from "class-validator";
  import { Transform } from "class-transformer";
  
  export class QueryProfileDto {
	@IsOptional()
	@IsString()
	@Transform(({ value }) => value?.toLowerCase().trim())  // normalize before validation
	@IsIn(["male", "female"], { message: "gender must be male or female" })
	gender?: string;
  
	@IsOptional()
	@IsString()
	@Transform(({ value }) => value?.toLowerCase().trim())  // normalize
	@IsIn(["child", "teenager", "adult", "senior"], {
	  message: "age_group must be child, teenager, adult, or senior",
	})
	age_group?: string;
  
	@IsOptional()
	@IsString()
	@Transform(({ value }) => value?.toUpperCase().trim())  // normalize country to uppercase
	country_id?: string;
  
	@IsOptional()
	@IsNumberString({}, { message: "min_age must be a number" })
	min_age?: string;
  
	@IsOptional()
	@IsNumberString({}, { message: "max_age must be a number" })
	max_age?: string;
  
	@IsOptional()
	@IsNumberString({}, { message: "min_gender_probability must be a number" })
	min_gender_probability?: string;
  
	@IsOptional()
	@IsNumberString({}, { message: "min_country_probability must be a number" })
	min_country_probability?: string;
  
	@IsOptional()
	@IsString()
	@Transform(({ value }) => value?.toLowerCase().trim())  // normalize
	@IsIn(["age", "created_at", "gender_probability"], {
	  message: "sort_by must be age, created_at, or gender_probability",
	})
	sort_by?: string;
  
	@IsOptional()
	@IsString()
	@Transform(({ value }) => value?.toLowerCase().trim())  
	@IsIn(["asc", "desc"], { message: "order must be asc or desc" })
	order?: string;
  
	@IsOptional()
	@IsNumberString({}, { message: "page must be a number" })
	page?: string;
  
	@IsOptional()
	@IsNumberString({}, { message: "limit must be a number" })
	limit?: string;
  }