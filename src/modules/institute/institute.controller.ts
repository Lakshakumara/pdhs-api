import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Permission } from '../../auth/permission.enum';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { SkipPermission } from '../../common/decorators/skip-permission.decorator';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { buildAuditContext } from '../../common/utils/audit-context.util';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { InstituteService } from './institute.service';
import {
  CreateInstituteDto,
  QueryInstituteDto,
  UpdateInstituteDto,
} from './dto/institute.dto';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller(['api/institutions', 'api/institute'])
export class InstituteController {
  constructor(private readonly service: InstituteService) {}

  @Get('districts')
  @SkipPermission()
  getDistricts(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.findDistricts(activeRole);
  }

  @Get()
  @RequirePermission(Permission.INSTITUTE_VIEW)
  getInstitutions(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryInstituteDto,
  ) {
    return this.service.findInstitutions(activeRole, query);
  }

  @Get(':id')
  @RequirePermission(Permission.INSTITUTE_VIEW)
  getInstitutionById(
    @Param('id') id: string,
    @ActiveRole() activeRole: JwtRoleClaim,
  ) {
    return this.service.getInstitutionById(id, activeRole);
  }

  @Post()
  @RequirePermission(Permission.INSTITUTE_CREATE)
  createInstitution(@Body() dto: CreateInstituteDto, @Req() req: any) {
    return this.service.createInstitution(dto, buildAuditContext(req));
  }

  @Post('add')
  @RequirePermission(Permission.INSTITUTE_CREATE)
  createInstitutionAlias(@Body() dto: CreateInstituteDto, @Req() req: any) {
    return this.service.createInstitution(dto, buildAuditContext(req));
  }

  @Put(':id')
  @RequirePermission(Permission.INSTITUTE_UPDATE)
  updateInstitution(
    @Param('id') id: string,
    @Body() dto: UpdateInstituteDto,
    @Req() req: any,
  ) {
    return this.service.updateInstitution(id, dto, buildAuditContext(req));
  }

  @Put(':id/edit')
  @RequirePermission(Permission.INSTITUTE_UPDATE)
  updateInstitutionAlias(
    @Param('id') id: string,
    @Body() dto: UpdateInstituteDto,
    @Req() req: any,
  ) {
    return this.service.updateInstitution(id, dto, buildAuditContext(req));
  }

  @Delete(':id')
  @RequirePermission(Permission.INSTITUTE_DELETE)
  deleteInstitution(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteInstitution(id, buildAuditContext(req));
  }
}

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api/districts')
export class DistrictController {
  constructor(private readonly service: InstituteService) {}

  @Get()
  @SkipPermission()
  getDistricts(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.findDistricts(activeRole);
  }
}
