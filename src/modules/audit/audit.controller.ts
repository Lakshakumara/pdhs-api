import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Permission } from '../../auth/permission.enum';
import { BaseQueryDto } from '../../shared/dto/base-query.dto';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get('audit')
  @RequirePermission(Permission.AUDIT_VIEW)
  getAuditLog(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: BaseQueryDto,
  ) {
    return this.service.findAuditLogs(activeRole, query);
  }
}
