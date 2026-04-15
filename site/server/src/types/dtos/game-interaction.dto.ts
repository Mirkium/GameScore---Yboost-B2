import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class LikeGameDto {
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}

export class CreateGameCommentDto {
  @IsString()
  @MaxLength(2000)
  comment!: string;
}

export class RateGameDto {
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;
}