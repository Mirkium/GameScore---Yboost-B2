import { Transform } from "class-transformer";
import { IsString, Length, Matches } from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown => {
  return typeof value === "string" ? value.trim() : value;
};

export class ProfileUsernameParamsDto {
  @Transform(trimString)
  @IsString()
  @Length(1, 50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "username must only contain letters, numbers, and underscores",
  })
  username!: string;
}