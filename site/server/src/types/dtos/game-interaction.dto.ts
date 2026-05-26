import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class LikeGameDto {
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}

export class CreateGameCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsString()
  @MaxLength(2000)
  comment!: string;
}

export class RateGameDto {
  @IsInt()
  @Min(0)
  @Max(100)
  rating!: number;
}

export class CreateGameReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rating?: number;
}