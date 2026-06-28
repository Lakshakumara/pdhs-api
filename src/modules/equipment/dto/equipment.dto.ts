import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransformDate } from '../../../common/decorators/transform-date.decorator';
import { BaseQueryDto } from '../../../shared/dto/base-query.dto';

// ─────────────────────────────────────────────
// SERVICE PLAN (nested in equipment)
// ─────────────────────────────────────────────

export class CreateServicePlanDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  agreementReference?: string;

  @IsOptional()
  @TransformDate()
  expiryDate?: Date;

  @IsNumber()
  noOfFreeService!: number;

  @IsOptional()
  @IsNumber()
  servicePerAnnum?: number;

  @IsOptional()
  serviceCosts?: Record<string, any>;

  @IsOptional()
  labourCosts?: Record<string, any>;

  @IsOptional()
  transportCosts?: Record<string, any>;

  @IsOptional()
  otherCosts?: Record<string, any>;

  @IsOptional()
  totalCosts?: Record<string, any>;

  @IsOptional()
  sparePartsCosts?: Record<string, any>;

  @IsOptional()
  @IsString()
  equipmentId!: string;
}

export class UpdateServicePlanDto {
  @IsOptional()
  @IsString()
  agreementReference?: string;

  @IsOptional()
  @TransformDate()
  expiryDate?: Date;

  @IsOptional()
  @IsNumber()
  sparePartDiscountPercent?: number;

  @IsOptional()
  yearlyPricing?: Record<string, number>;
}

// ─────────────────────────────────────────────
// EQUIPMENT SPARE PART (nested in equipment)
// ─────────────────────────────────────────────

export class CreateEquipmentSparePartDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsNumber()
  quantity!: number;

  @IsString()
  sparePartType!: string;

  @IsOptional()
  @TransformDate()
  expiryOrWarrantyDate?: Date;

  @IsOptional()
  @IsString()
  equipmentId!: string;
}

export class UpdateEquipmentSparePartDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  sparePartType?: string;

  @IsOptional()
  @TransformDate()
  expiryOrWarrantyDate?: Date;
}

// ─────────────────────────────────────────────
// EQUIPMENT
// ─────────────────────────────────────────────

export class CreateEquipmentDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  tenderNumber?: string;

  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string;

  @IsOptional()
  @IsString()
  modelNumber?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsNumber()
  quantityReceived!: number;

  @IsOptional()
  @TransformDate()
  dateOfManufacture?: Date;

  @IsOptional()
  @TransformDate()
  dateOfReceipt?: Date;

  @IsOptional()
  @IsInt()
  warrantyPeriodMonths?: number;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  assignedInstitutionId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateServicePlanDto)
  servicePlan?: CreateServicePlanDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEquipmentSparePartDto)
  spareParts?: CreateEquipmentSparePartDto[];
}

export class UpdateEquipmentDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  tenderNumber?: string;

  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string;

  @IsOptional()
  @IsString()
  modelNumber?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantityReceived?: number;

  @IsOptional()
  @Type(() => Date)
  dateOfManufacture?: Date;

  @IsOptional()
  @Type(() => Date)
  dateOfReceipt?: Date;

  @IsOptional()
  @IsInt()
  warrantyPeriodMonths?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  assignedInstitutionId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateServicePlanDto)
  servicePlan?: CreateServicePlanDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEquipmentSparePartDto)
  spareParts?: CreateEquipmentSparePartDto[];
}

export class QueryEquipmentDto extends BaseQueryDto {
  @IsOptional()
  category?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  assignedInstitutionId?: string;
}
