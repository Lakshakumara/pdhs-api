import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../shared/dto/base-query.dto';

export class QueryInventoryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
