import {
  IsString, IsOptional, IsArray, IsIn, ValidateNested, IsBoolean, IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TransformDate } from '../../../common/decorators/transform-date.decorator';
import { BaseQueryDto } from '../../../shared/dto/base-query.dto';

export type RepairPriority = 'Routine' | 'Urgent' | 'Emergency';

// ─────────────────────────────────────────────
// REPAIR REQUEST
// ─────────────────────────────────────────────

export class CreateRepairRequestDto {
  @IsString()
  id!: string;

  @IsString()
  equipmentId!: string;

  @IsOptional()
  @IsString()
  equipmentName?: string;

  @IsOptional()
  @IsString()
  equipmentSerialNumber?: string;

  @IsOptional()
  @IsString()
  sparePartId?: string;

  @IsOptional()
  @IsString()
  sparePartName?: string;

  @IsOptional()
  @IsString()
  faultDescription?: string;

  @IsString()
  @IsIn(['Emergency', 'Urgent', 'Routine'])
  priority!: string;

  @IsString()
  submittedByUserId!: string;

  @IsOptional()
  @IsString()
  submittedByUserName?: string;

  @TransformDate()
  submissionDate!: Date;

  @IsString()
  institutionId!: string;

  @IsOptional()
  @IsString()
  institutionName?: string;
}

export class UpdateRepairRequestDto {
  @IsOptional()
  @IsString()
  faultDescription?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}

export class QueryRepairRequestDto extends BaseQueryDto {
  @IsOptional()
  category?: string;

  @IsOptional()
  priority?: string;

  @IsOptional()
  status?: string;
}

export class QueryEquipmentRepairHistoryDto extends BaseQueryDto {
  @IsOptional()
  equipmentId?: string;

  @IsOptional()
  status?: string;
}

// ─────────────────────────────────────────────
// INSPECTED SPARE PART (nested in work order)
// ─────────────────────────────────────────────

export class CreateInspectedSparePartDto {
  @IsString()
  id!: string;

  @IsString()
  sparePartId!: string;

  @IsOptional()
  @IsString()
  sparePartName?: string;

  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  inspected!: boolean;

  @IsOptional()
  @IsString()
  conditionNotes?: string;

  @IsString()
  workOrderId!: string;
}

// ─────────────────────────────────────────────
// PART USED (nested in work order)
// ─────────────────────────────────────────────

export class CreatePartUsedDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  quantity!: number;

  @IsString()
  inventoryItemId!: string;

  @IsString()
  workOrderId!: string;
}

// ─────────────────────────────────────────────
// WORK ORDER
// ─────────────────────────────────────────────

export class CreateWorkOrderDto {
  @IsString()
  id!: string;

  @IsString()
  repairRequestId!: string;

  @IsOptional()
  @IsString()
  assignedTechnicianId?: string;

  @IsOptional()
  @IsString()
  assignedTechnicianName?: string;

  @IsOptional()
  @IsString()
  diagnosisNotes?: string;

  @IsString()
  status!: string;

  @TransformDate()
  statusDate!: Date;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInspectedSparePartDto)
  inspectedSpareParts?: CreateInspectedSparePartDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePartUsedDto)
  partsUsed?: CreatePartUsedDto[];
}

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  assignedTechnicianId?: string;

  @IsOptional()
  @IsString()
  assignedTechnicianName?: string;

  @IsOptional()
  @IsString()
  diagnosisNotes?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Submitted', 'Acknowledged', 'In Repair', 'Completed', 'Closed'])
  status?: string;

  @IsOptional()
  @TransformDate()
  statusDate?: Date;

  @IsOptional()
  @IsString()
  institutionId?: string;
}

export class QueryWorkOrderDto extends BaseQueryDto {
  @IsOptional()
  repairRequestId?: string;

  @IsOptional()
  status?: string;
}


export interface EscalateToVendorDto {
  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;
  repairBasis: 'WARRANTY' | 'PAID';
  handoverType: 'FIELD_VISIT' | 'EQUIPMENT_SENT';
  // EQUIPMENT_SENT fields
  dispatchDate?: Date;
  dispatchedBy?: string;
  courierRef?: string;
  // FIELD_VISIT fields
  scheduledDate?: Date;
  visitLocation?: string;
  // Optional vendor reference
  vendorRefNumber?: string;
}

export interface VendorCompletedDto {
  returnDate: Date;
  returnNotes?: string;
}
