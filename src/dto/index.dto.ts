import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator'
import { Type } from 'class-transformer'
import { TransformDate } from '../common/decorators/transform-date.decorator'

// ─────────────────────────────────────────────
// DISTRICT
// ─────────────────────────────────────────────

export class CreateDistrictDto {
  @IsString()
  id!: string

  @IsString()
  name!: string
}

export class UpdateDistrictDto {
  @IsOptional()
  @IsString()
  name?: string
}

// ─────────────────────────────────────────────
// INSTITUTION
// ─────────────────────────────────────────────

export class CreateInstitutionDto {
  @IsString()
  id?: string

  @IsString()
  name!: string

  @IsString()
  type!: string

  @IsBoolean()
  active!: boolean

  @IsOptional()
  @IsString()
  districtId?: string
}

export class UpdateInstitutionDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsBoolean()
  active?: boolean

  @IsOptional()
  @IsString()
  districtId?: string
}

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────

export class CreateUserDto {
  @IsString()
  id!: string

  @IsString()
  username!: string

  @IsString()
  fullName!: string

  @IsString()
  @IsIn([
    'System Administrator',
    'Biomedical Technician',
    'Procurement Officer',
    'PDHS Viewer',
    'RDHS Officer',
    'Institution User',
  ])
  role!: string

  @IsBoolean()
  active!: boolean

  @IsOptional()
  @IsString()
  districtId?: string

  @IsOptional()
  @IsString()
  institutionId?: string
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string

  @IsOptional()
  @IsString()
  role?: string

  @IsOptional()
  @IsBoolean()
  active?: boolean

  @IsOptional()
  @IsString()
  districtId?: string

  @IsOptional()
  @IsString()
  institutionId?: string
}

// ─────────────────────────────────────────────
// SUPPLIER
// ─────────────────────────────────────────────

export class CreateSupplierDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  contactName?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  performanceNotes?: string

  @IsOptional()
  @IsInt()
  rating?: number
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  contactName?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  performanceNotes?: string

  @IsOptional()
  @IsInt()
  rating?: number
}

// ─────────────────────────────────────────────
// INVENTORY ITEM
// ─────────────────────────────────────────────

export class CreateInventoryItemDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @IsString()
  category!: string

  @IsNumber()
  currentStock!: number

  @IsNumber()
  minStockThreshold!: number

  @IsString()
  unitOfMeasure!: string

  @IsNumber()
  costPerUnit!: number
}

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsNumber()
  currentStock?: number

  @IsOptional()
  @IsNumber()
  minStockThreshold?: number

  @IsOptional()
  @IsString()
  unitOfMeasure?: string

  @IsOptional()
  @IsNumber()
  costPerUnit?: number
}

// ─────────────────────────────────────────────
// SERVICE PLAN
// ─────────────────────────────────────────────

export class CreateServicePlanDto {
  @IsString()
  id!: string

  @IsOptional()
  @IsString()
  agreementReference?: string

  @IsOptional()
  @TransformDate()                   // "2029-06-20" → Date
  expiryDate?: Date

  @IsOptional()
  @IsNumber()
  sparePartDiscountPercent?: number

  @IsOptional()
  yearlyPricing?: Record<string, number>

  @IsString()
  equipmentId!: string
}

export class UpdateServicePlanDto {
  @IsOptional()
  @IsString()
  agreementReference?: string

  @IsOptional()
  @TransformDate()
  expiryDate?: Date

  @IsOptional()
  @IsNumber()
  sparePartDiscountPercent?: number

  @IsOptional()
  yearlyPricing?: Record<string, number>
}

// ─────────────────────────────────────────────
// EQUIPMENT COMPONENT
// ─────────────────────────────────────────────

export class CreateEquipmentComponentDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  partNumber?: string

  @IsOptional()
  @IsString()
  serialNumber?: string

  @IsNumber()
  quantity!: number

  @IsString()
  componentType!: string

  @IsOptional()
  @TransformDate()                   // "2025-04-15" → Date
  expiryOrWarrantyDate?: Date

  @IsString()
  equipmentId!: string
}

export class UpdateEquipmentComponentDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  partNumber?: string

  @IsOptional()
  @IsString()
  serialNumber?: string

  @IsOptional()
  @IsNumber()
  quantity?: number

  @IsOptional()
  @IsString()
  componentType?: string

  @IsOptional()
  @TransformDate()
  expiryOrWarrantyDate?: Date
}

// ─────────────────────────────────────────────
// EQUIPMENT
// ─────────────────────────────────────────────

export class CreateEquipmentDto {
  @IsString()
  id?: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  category?: string

  @IsString()
  manufacturer?: string

  @IsString()
  countryOfOrigin?: string

  @IsOptional()
  @IsString()
  supplierName?: string

  @IsOptional()
  @IsString()
  tenderNumber?: string

  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string

  @IsOptional()
  @IsString()
  modelNumber?: string

  @IsOptional()
  @IsString()
  serialNumber?: string

  @IsOptional()
  @IsString()
  batchNumber?: string

  @IsNumber()
  quantityReceived?: number

  @IsOptional()
  @TransformDate()                   // "2024-02-15" → Date
  dateOfManufacture?: Date

  @IsOptional()
  @TransformDate()                   // "2024-06-20" → Date
  dateOfReceipt?: Date

  @IsOptional()
  @IsInt()
  warrantyPeriodMonths?: number

  @IsString()
  status!: string

  @IsOptional()
  @IsString()
  assignedInstitutionId?: string

  // Nested: create service plan together with equipment
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateServicePlanDto)
  servicePlan?: CreateServicePlanDto

  // Nested: create components together with equipment
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEquipmentComponentDto)
  components?: CreateEquipmentComponentDto[]
}

export class UpdateEquipmentDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  manufacturer?: string

  @IsOptional()
  @IsString()
  countryOfOrigin?: string

  @IsOptional()
  @IsString()
  supplierName?: string

  @IsOptional()
  @IsString()
  tenderNumber?: string

  @IsOptional()
  @IsString()
  serialNumber?: string

  @IsOptional()
  @IsNumber()
  quantityReceived?: number

  @IsOptional()
  @TransformDate()
  dateOfManufacture?: Date

  @IsOptional()
  @TransformDate()
  dateOfReceipt?: Date

  @IsOptional()
  @IsInt()
  warrantyPeriodMonths?: number

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  assignedInstitutionId?: string
}

// ─────────────────────────────────────────────
// ASSIGNMENT
// ─────────────────────────────────────────────

export class CreateAssignmentDto {
  @IsString()
  id!: string

  @IsString()
  equipmentId!: string

  @IsString()
  fromEntity!: string

  @IsString()
  toEntity!: string

  @IsString()
  toEntityId!: string

  @IsNumber()
  quantity!: number

  @TransformDate()                   // "2023-04-16" → Date  (required field)
  assignmentDate!: Date

  @IsString()
  status!: string
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @TransformDate()
  assignmentDate?: Date
}

// ─────────────────────────────────────────────
// REPAIR REQUEST
// ─────────────────────────────────────────────

export class CreateRepairRequestDto {
  @IsString()
  id!: string

  @IsString()
  equipmentId!: string

  @IsOptional()
  @IsString()
  equipmentName?: string

  @IsOptional()
  @IsString()
  equipmentSerialNumber?: string

  @IsOptional()
  @IsString()
  componentId?: string

  @IsOptional()
  @IsString()
  componentName?: string

  @IsOptional()
  @IsString()
  faultDescription?: string

  @IsString()
  @IsIn(['Emergency', 'Urgent', 'Routine'])
  priority!: string

  @IsString()
  submittedByUserId!: string

  @IsOptional()
  @IsString()
  submittedByUserName?: string

  @TransformDate()                   // "2026-05-24T10:30:00Z" → Date
  submissionDate!: Date

  @IsString()
  institutionId!: string

  @IsOptional()
  @IsString()
  institutionName?: string
}

export class UpdateRepairRequestDto {
  @IsOptional()
  @IsString()
  faultDescription?: string

  @IsOptional()
  @IsString()
  priority?: string
}

// ─────────────────────────────────────────────
// INSPECTED COMPONENT
// ─────────────────────────────────────────────

export class CreateInspectedComponentDto {
  @IsString()
  id!: string

  @IsString()
  componentId!: string

  @IsOptional()
  @IsString()
  componentName?: string

  @IsBoolean()
  inspected!: boolean

  @IsOptional()
  @IsString()
  conditionNotes?: string

  @IsString()
  workOrderId!: string
}

// ─────────────────────────────────────────────
// PART USED
// ─────────────────────────────────────────────

export class CreatePartUsedDto {
  @IsString()
  id!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  quantity!: number

  @IsString()
  inventoryItemId!: string

  @IsString()
  workOrderId!: string
}

// ─────────────────────────────────────────────
// WORK ORDER
// ─────────────────────────────────────────────

export class CreateWorkOrderDto {
  @IsString()
  id!: string

  @IsString()
  repairRequestId!: string

  @IsOptional()
  @IsString()
  assignedTechnicianId?: string

  @IsOptional()
  @IsString()
  assignedTechnicianName?: string

  @IsOptional()
  @IsString()
  diagnosisNotes?: string

  @IsString()
  status!: string

  @TransformDate()                   // "2026-05-25T08:00:00Z" → Date
  statusDate!: Date

  @IsOptional()
  @IsString()
  institutionId?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInspectedComponentDto)
  inspectedComponents?: CreateInspectedComponentDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePartUsedDto)
  partsUsed?: CreatePartUsedDto[]
}

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  assignedTechnicianId?: string

  @IsOptional()
  @IsString()
  assignedTechnicianName?: string

  @IsOptional()
  @IsString()
  diagnosisNotes?: string

  @IsOptional()
  @IsString()
  @IsIn(['Submitted', 'Acknowledged', 'In Repair', 'Completed', 'Closed'])
  status?: string

  @IsOptional()
  @TransformDate()
  statusDate?: Date

  @IsOptional()
  @IsString()
  institutionId?: string
}

// ─────────────────────────────────────────────
// PROCUREMENT PLAN
// ─────────────────────────────────────────────

export class CreateProcurementPlanDto {
  @IsString()
  id!: string

  @IsString()
  itemDescription!: string

  @IsNumber()
  estimatedQuantity!: number

  @IsNumber()
  estimatedCost!: number

  @IsString()
  procurementMethod!: string
}

export class UpdateProcurementPlanDto {
  @IsOptional()
  @IsString()
  itemDescription?: string

  @IsOptional()
  @IsNumber()
  estimatedQuantity?: number

  @IsOptional()
  @IsNumber()
  estimatedCost?: number

  @IsOptional()
  @IsString()
  procurementMethod?: string
}

// ─────────────────────────────────────────────
// PURCHASE ORDER ITEM
// ─────────────────────────────────────────────

export class CreatePurchaseOrderItemDto {
  @IsString()
  id!: string

  @IsString()
  description!: string

  @IsNumber()
  quantity!: number

  @IsNumber()
  unitCost!: number

  @IsString()
  category!: string

  @IsString()
  purchaseOrderId!: string
}

// ─────────────────────────────────────────────
// PURCHASE ORDER
// ─────────────────────────────────────────────

export class CreatePurchaseOrderDto {
  @IsString()
  id!: string

  @IsString()
  planId!: string

  @IsString()
  supplierId!: string

  @IsOptional()
  @IsString()
  supplierName?: string

  @IsString()
  poNumber!: string

  @TransformDate()                   // "2026-05-10" → Date
  orderDate!: Date

  @IsString()
  @IsIn(['Pending', 'Approved', 'Rejected'])
  approvalStatus!: string

  @IsNumber()
  totalCost!: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items?: CreatePurchaseOrderItemDto[]
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  @IsIn(['Pending', 'Approved', 'Rejected'])
  approvalStatus?: string

  @IsOptional()
  @IsNumber()
  totalCost?: number
}

// ─────────────────────────────────────────────
// GRN (GOODS RECEIVED NOTE)
// ─────────────────────────────────────────────

export class CreateGrnDto {
  @IsString()
  id!: string

  @IsString()
  purchaseOrderId!: string

  @IsString()
  poNumber!: string

  @IsString()
  grnNumber!: string

  @TransformDate()                   // "2026-05-20" → Date
  receivedDate!: Date

  @IsString()
  @IsIn(['Pending', 'Confirmed'])
  status!: string
}

export class UpdateGrnDto {
  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @TransformDate()
  receivedDate?: Date
}

// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────

export class CreateAuditLogDto {
  @IsString()
  id!: string

  @TransformDate()                   // "2026-05-24T10:30:00Z" → Date
  timestamp!: Date

  @IsString()
  userId!: string

  @IsOptional()
  @IsString()
  userName?: string

  @IsOptional()
  @IsString()
  userRole?: string

  @IsString()
  @IsIn(['CREATE', 'UPDATE', 'DELETE'])
  action!: string

  @IsString()
  entityName!: string

  @IsString()
  recordId!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  institutionId?: string
}