import { IsString, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

export class CreateProfileDto {
  @IsString({ message: "Name must be a string" })
  @IsNotEmpty({ message: "Name is required" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value
  )
  name!: string;
}