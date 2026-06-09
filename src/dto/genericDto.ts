import { Type } from "class-transformer";
import { IsOptional } from "class-validator";

export class BaseQueryDto {

  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  size: number = 20;

  @IsOptional()
  search?: string;

  @IsOptional()
  sortBy?: string;

  @IsOptional()
  sortOrder?: 'asc' | 'desc'= 'asc';;
}