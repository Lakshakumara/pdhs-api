import {
  Controller, Get,
  Param,
  ParseUUIDPipe,
  Query, UseGuards
} from '@nestjs/common';
import {
  QueryEquipmentDto, QueryEquipmentRepairHistoryDto, QueryInstitutionDto, QueryInventoryDto,
  QueryRepairRequestDto, QueryWorkOrdertDto
} from 'src/dto/index.dto';
import { QueryService } from 'src/service/query.service';
import { ActiveRoleGuard, JwtAuthGuard } from 'src/common/guard/auth.guard';
import type { JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { ActiveRole } from 'src/common/decorators/active-role.decorator';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { Permission } from 'src/auth/permission.enum';
import { PermissionGuard } from 'src/common/guard/permission-guard';
import { SkipPermission } from 'src/common/decorators/skip-permission.decorator';

/**
 * Guard chain applied once at the controller level — every route below
 * automatically gets:
 *   1. JwtAuthGuard    → verifies the JWT, populates req.user
 *   2. ActiveRoleGuard → resolves req.activeRole from req.user.roles +
 *                        x-role/x-scope-* headers (validated against the
 *                        signed JWT, not trusted blindly)
 *   3.PermissionGuard → check query level permission for transactions
 *
 */
@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api')
export class QueryController {
  constructor(
    private readonly service: QueryService,
  ) { }

  @Get('/dashboard/summary')
  @RequirePermission(Permission.EQUIPMENT_VIEW)
  getDashboardSumarry(@ActiveRole() activeRole: JwtRoleClaim) {
    console.log('dashboard request with', activeRole)
    return this.service.getDashboardSumarry(activeRole);
  }

  @Get('/dashboard/category-distribution')
  @RequirePermission(Permission.EQUIPMENT_VIEW)
  getCategoryDistribution(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.getCategoryDistribution(activeRole);
  }

  @Get('/dashboard/urgent-repairs')
  @RequirePermission(Permission.REPAIR_REQUEST_VIEW)
  getUrgentRepairs(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.getUrgentRepairs(activeRole);
  }

  @Get('/dashboard/organization-tree')
  @SkipPermission()
  getOrganizationTree(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.organizationTree(activeRole);
  }

  @Get('districts')
  @SkipPermission()
  getDistricts(
    @ActiveRole() activeRole: JwtRoleClaim
  ) {
    return this.service.findDistrict(activeRole)
  }

  @Get('/institute')
  @SkipPermission()
  getAccessibleInstitutions(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryInstitutionDto,
  ) {
    return this.service.findInstitute(activeRole, query);
  }

  @Get('/equipment')
  @RequirePermission(Permission.EQUIPMENT_VIEW)
  findEquipment(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryEquipmentDto,) {
    return this.service.findEquipment(activeRole, query);
  }

  @Get('/repair-requests')
  @RequirePermission(Permission.REPAIR_REQUEST_VIEW)
  findRepairRequest(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryRepairRequestDto,) {
    return this.service.findRepairRequest(activeRole, query);
  }

  @Get('/repair-history')
  @RequirePermission(Permission.REPAIR_REQUEST_VIEW)
  findEquipmentRepairHistory(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryEquipmentRepairHistoryDto,) {
    return this.service.findEquipmentRepairHistory(activeRole, query);
  }

  @Get('work-order/:requestId')
  async findOne(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('requestId', ParseUUIDPipe) requestId: string,) {
    return this.service.findWorkOrder(activeRole, requestId);
  }

  @Get('work-order')
  @RequirePermission(Permission.WORK_ORDER_VIEW)
  async getWorkOrders(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryWorkOrdertDto,) {
    return this.service.findWorkOrders(activeRole, query);
  }

  @Get('inventory-items')
  @RequirePermission(Permission.INVENTORY_VIEW)
  async getInventoryItems(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryInventoryDto,
  ) {
    return this.service.inventoryItem(activeRole, query);
  }

  @Get('audit')
  @RequirePermission(Permission.AUDIT_VIEW)
  async getAuditLog(@ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: any,
  ) {
    return this.service.auditLog(activeRole, query);
  }
}
function Parawork(target: QueryController, propertyKey: 'findOne', parameterIndex: 1): void {
  throw new Error('Function not implemented.');
}

