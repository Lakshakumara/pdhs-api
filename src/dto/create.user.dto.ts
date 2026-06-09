// ─────────────────────────────────────────────
// dto/create-user.dto.ts
// ─────────────────────────────────────────────
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  MinLength,
  Matches,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoleType, ScopeType } from '@prisma/client';

export class RoleAssignmentDto {
  @IsEnum(RoleType)
  role?: RoleType;

  @IsEnum(ScopeType)
  scopeType?: ScopeType;

  @IsOptional()
  @IsString()
  scopeId?: string; // districtId | institutionId | null
}

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'Username may only contain lowercase letters, numbers, dots, hyphens, underscores',
  })
  username?: string;

  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  roles?: RoleAssignmentDto[];
}

// ─────────────────────────────────────────────
// dto/update-user.dto.ts
// ─────────────────────────────────────────────
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  roles?: RoleAssignmentDto[];
}