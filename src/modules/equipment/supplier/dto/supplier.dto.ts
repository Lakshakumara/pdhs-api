import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/shared/dto/base-query.dto';
export class QuerySupplierDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  rating?: string;
}
