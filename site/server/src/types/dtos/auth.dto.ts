import { Transform } from "class-transformer";
import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown => {
  return typeof value === "string" ? value.trim() : value;
};

export class RegisterDto {
  @Transform(trimString)
  @IsEmail()
  email!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password!: string;

  @Transform(trimString)
  @IsString()
  @IsOptional()
  @MaxLength(50)
  username?: string;

  @Transform(trimString)
  @IsString()
  @IsOptional()
  @MaxLength(255)
  firstName?: string;

  @Transform(trimString)
  @IsString()
  @IsOptional()
  @MaxLength(255)
  lastName?: string;
}

export class LoginDto {
  @Transform(trimString)
  @IsEmail()
  email!: string;

  @Transform(trimString)
  @IsString()
  password!: string;
}