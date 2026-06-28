import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { SkipPermission } from '../../common/decorators/skip-permission.decorator';
import { Permission } from '../../auth/permission.enum';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  @RequirePermission(Permission.EQUIPMENT_VIEW)
  getDashboardSummary(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.getDashboardSummary(activeRole);
  }

  @Get('category-distribution')
  @RequirePermission(Permission.EQUIPMENT_VIEW)
  getCategoryDistribution(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.getCategoryDistribution(activeRole);
  }

  @Get('urgent-repairs')
  @RequirePermission(Permission.REPAIR_REQUEST_VIEW)
  getUrgentRepairs(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.getUrgentRepairs(activeRole);
  }

  @Get('organization-tree')
  @SkipPermission()
  getOrganizationTree(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.organizationTree(activeRole);
  }
}
