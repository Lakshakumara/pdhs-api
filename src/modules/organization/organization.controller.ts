import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { QueryInstitutionDto } from './dto/organization.dto';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { SkipPermission } from '../../common/decorators/skip-permission.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Permission } from '../../auth/permission.enum';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get('districts')
  @SkipPermission()
  getDistricts(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.findDistrict(activeRole);
  }

  @Get('institute')
  @RequirePermission(Permission.INSTITUTE_VIEW)
  getAccessibleInstitutions(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryInstitutionDto,
  ) {
    return this.service.findInstitute(activeRole, query);
  }
}
