// institutions.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Permission } from 'src/auth/permission.enum';
import { ActiveRole } from 'src/common/decorators/active-role.decorator';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { JwtAuthGuard, ActiveRoleGuard } from 'src/common/guards/auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { InstituteService } from './institute.service';
import { QueryInstituteDto } from './dto/institute.dto';
import type { JwtRoleClaim } from '../../auth/jwt-payload.interface';

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api/institutions')
export class InstituteController {
    constructor(private readonly service: InstituteService) { }

    @Get('inventory-items')
    @RequirePermission(Permission.INSTITUTE_VIEW)
    getInventoryItems(
        @ActiveRole() activeRole: JwtRoleClaim,
        @Query() query: QueryInstituteDto,
    ) {
        return this.service.findInstitutions(activeRole, query);
    }
/*
    @Post()
    async create(@Body() data: any) {
        return this.prisma.institution.create({
            data: {
                id: `inst_${Math.random().toString(36).substr(2, 9)}`,
                name: data.name,
                email: data.email || null,
                tp: data.tp || null,
                type: data.type,
                districtId: data.districtId,
                active: true // Defaults to true on creation
            }
        });
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.prisma.institution.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email || null,
                tp: data.tp || null,
                type: data.type,
                districtId: data.districtId
            }
        });
    }*/
}