import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryDto } from '../../../shared/dto/base-query.dto';

const phoneRegex = /^[+]?[\d\s-]{7,20}$/;
const phoneMessage =
  'Must be a valid telephone number (7 to 20 digits, optional leading +)';

export class QueryInstituteDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  active?: boolean;
}

export class CreateInstituteDto {
  @IsString()
  @MinLength(3, { message: 'Institution name must be at least 3 characters' })
  name!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString()
  districtId?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @Matches(phoneRegex, { message: phoneMessage })
  tp?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateInstituteDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Institution name must be at least 3 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString()
  districtId?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @Matches(phoneRegex, { message: phoneMessage })
  tp?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
