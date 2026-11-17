import {
  Body,
  Req,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { Permission } from 'src/auth/permission.enum';
import { ActiveRole } from 'src/common/decorators/active-role.decorator';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { JwtAuthGuard, ActiveRoleGuard } from 'src/common/guards/auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import {
  CreateSupplierDto,
  QuerySupplierDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { SupplierService } from './supplier.service';
import { buildAuditContext } from 'src/common/utils/audit-context.util';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api/supplier')
export class SuppliersController {
  constructor(private readonly service: SupplierService) {}

  @Get()
  @RequirePermission(() => [
    Permission.SUPPLIER_VIEW,
    Permission.PROCUREMENT_VIEW,
  ])
  getSuppliers(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QuerySupplierDto,
  ) {
    return this.service.findSupplier(activeRole, query);
  }

  @Get(':id')
  @RequirePermission(() => [
    Permission.SUPPLIER_VIEW,
    Permission.PROCUREMENT_VIEW,
  ])
  getSupplierById(@Param('id') id: string) {
    return this.service.getSupplierById(id);
  }

  @Post()
  @RequirePermission(() => [
    Permission.SUPPLIER_CREATE,
    Permission.PROCUREMENT_CREATE,
  ])
  createSupplier(@Body() dto: CreateSupplierDto, @Req() req: Request) {
    return this.service.createSupplier(dto, buildAuditContext(req));
  }

  @Post('add')
  @RequirePermission(() => [
    Permission.SUPPLIER_CREATE,
    Permission.PROCUREMENT_CREATE,
  ])
  createSupplierAlias(@Body() dto: CreateSupplierDto, @Req() req: Request) {
    return this.service.createSupplier(dto, buildAuditContext(req));
  }

  @Put(':id')
  @RequirePermission(() => [
    Permission.SUPPLIER_UPDATE,
    Permission.PROCUREMENT_CREATE,
  ])
  updateSupplier(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @Req() req: Request,  ) {
    return this.service.updateSupplier(id, dto, buildAuditContext(req));
  }

  @Put(':id/edit')
  @RequirePermission(() => [
    Permission.SUPPLIER_UPDATE,
    Permission.PROCUREMENT_CREATE,
  ])
  updateSupplierAlias(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @Req() req: Request,  ) {
    return this.service.updateSupplier(id, dto, buildAuditContext(req));
  }

  @Delete(':id')
  @RequirePermission(() => [Permission.SUPPLIER_DELETE])
  deleteSupplier(@Param('id') id: string, @Req() req: Request) {
    return this.service.deleteSupplier(id, buildAuditContext(req));
  }
}
