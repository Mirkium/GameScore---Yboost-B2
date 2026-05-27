import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class LikeGameDto {
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}

export class CreateGameReviewDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @MaxLength(2000)
  comment!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  rating!: number;
}