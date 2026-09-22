import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../shared/dto/base-query.dto';

export class QueryInstitutionDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  districtId?: string;
}
