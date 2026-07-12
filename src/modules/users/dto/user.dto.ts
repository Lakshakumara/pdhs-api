import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsEnum,
  Matches,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RoleType, ScopeType } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'Username may only contain lowercase letters, numbers, dots, hyphens, underscores',
  })
  username!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
   @Transform(({value}) => {
    if(value === 'true') return true
    if(value === 'false') return false
    return value
  })
  @IsBoolean()
  mustChangePassword?: boolean;

  @IsEnum(RoleType)
  role!: RoleType;

  @IsEnum(ScopeType)
  scopeType!: ScopeType;

  @IsOptional()
  @IsString()
  scopeId?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}

export class QueryUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({value}) => {
    if(value === 'true') return true
    if(value === 'false') return false
    return value
  })
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  size: number = 20;
}

export class AddRoleDto {
  @IsEnum(RoleType)
  role!: RoleType;

  @IsEnum(ScopeType)
  scopeType!: ScopeType;

  @IsOptional()
  @IsString()
  scopeId?: string;
}

export class GrantPermissionDto {
  @IsString()
  permission!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
