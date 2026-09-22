// suppliers.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import type { JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { Permission } from 'src/auth/permission.enum';
import { ActiveRole } from 'src/common/decorators/active-role.decorator';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { JwtAuthGuard, ActiveRoleGuard } from 'src/common/guards/auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { QueryInstituteDto } from 'src/modules/institute/dto/institute.dto';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api/supplier')
export class SuppliersController {
    constructor(private readonly service: SupplierService) { }

    @Get()
    @RequirePermission(Permission.INSTITUTE_VIEW)
    getInventoryItems(
        @ActiveRole() activeRole: JwtRoleClaim,
        @Query() query: QueryInstituteDto,
    ) {
        return this.service.findSupplier(activeRole, query);
    }
  /*@Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('rating') rating?: string,
    @Query('search') search?: string
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (rating) where.rating = +rating;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: +skip,
        take: +limit,
        orderBy: { name: 'asc' }
      }),
      this.prisma.supplier.count({ where })
    ]);

    return { items, total };
  }

  @Post()
  async create(@Body() data: any) {
    return this.prisma.supplier.create({
      data: {
        id: `supp_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        performanceNotes: data.performanceNotes || null,
        rating: data.rating || null,
        remarks: data.remarks || null,
        supplyItem: data.supplyItem || [] // Formatted as [{id, name}]
      }
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        performanceNotes: data.performanceNotes || null,
        rating: data.rating || null,
        remarks: data.remarks || null,
        supplyItem: data.supplyItem || []
      }
    });
  }*/
}