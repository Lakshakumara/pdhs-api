import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.service.createSupplier(dto);
  }

  @Post('add')
  @RequirePermission(() => [
    Permission.SUPPLIER_CREATE,
    Permission.PROCUREMENT_CREATE,
  ])
  createSupplierAlias(@Body() dto: CreateSupplierDto) {
    return this.service.createSupplier(dto);
  }

  @Put(':id')
  @RequirePermission(() => [
    Permission.SUPPLIER_UPDATE,
    Permission.PROCUREMENT_CREATE,
  ])
  updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.updateSupplier(id, dto);
  }

  @Put(':id/edit')
  @RequirePermission(() => [
    Permission.SUPPLIER_UPDATE,
    Permission.PROCUREMENT_CREATE,
  ])
  updateSupplierAlias(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.updateSupplier(id, dto);
  }

  @Delete(':id')
  @RequirePermission(() => [Permission.SUPPLIER_DELETE])
  deleteSupplier(@Param('id') id: string) {
    return this.service.deleteSupplier(id);
  }
}
