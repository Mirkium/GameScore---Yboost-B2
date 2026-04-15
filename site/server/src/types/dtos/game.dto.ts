import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown => {
  return typeof value === "string" ? value.trim() : value;
};

export class ExternalGameParamsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gameId!: number;
}

export class ExternalGameSearchQueryDto {
  @Transform(trimString)
  @IsOptional()
  @IsString()
  search?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  releasedFrom?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  releasedTo?: string;

  @Type(() => Number)
  @IsOptional()
  @Min(0)
  @Max(5)
  ratingMin?: number;

  @Type(() => Number)
  @IsOptional()
  @Min(0)
  @Max(5)
  ratingMax?: number;

  @Type(() => Number)
  @IsOptional()
  @Min(0)
  @Max(100)
  metacriticMin?: number;

  @Type(() => Number)
  @IsOptional()
  @Min(0)
  @Max(100)
  metacriticMax?: number;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  platforms?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  genres?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  tags?: string;

  @Transform(trimString)
  @IsOptional()
  @IsIn([
    "name",
    "-name",
    "released",
    "-released",
    "added",
    "-added",
    "created",
    "-created",
    "updated",
    "-updated",
    "rating",
    "-rating",
    "metacritic",
    "-metacritic",
  ])
  ordering?: string;
}

export class PopularGamesQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  periodDays?: number;
}