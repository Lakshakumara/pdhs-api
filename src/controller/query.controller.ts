import {
  Controller, Get,
  Query, UseGuards
} from '@nestjs/common';
import {
  QueryEquipmentDto, QueryInstitutionDto, QueryInventoryDto,
  QueryRepairRequestDto, QueryWorkOrdertDto
} from 'src/dto/index.dto';
import { EquipmentService } from 'src/service/equipment.service';
import { QueryService } from 'src/service/query.service';
import { ActiveRole } from 'src/auth/active.role';
import { ActiveRoleGuard, JwtAuthGuard } from 'src/auth/auth.guard';
import type { JwtRoleClaim } from 'src/auth/jwt-payload.interface';

/**
 * Guard chain applied once at the controller level — every route below
 * automatically gets:
 *   1. JwtAuthGuard    → verifies the JWT, populates req.user
 *   2. ActiveRoleGuard → resolves req.activeRole from req.user.roles +
 *                        x-role/x-scope-* headers (validated against the
 *                        signed JWT, not trusted blindly)
 *
 * Permission checks (PermissionService.require) and row-level scoping
 * (ScopeService.xxxWhere) remain in QueryService — unchanged. This guard
 * chain only removes the repetitive @Headers() boilerplate that used to
 * appear on every method.
 */
@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('api')
export class QueryController {
  constructor(
    private readonly eqService: EquipmentService,
    private readonly service: QueryService,
  ) {}

  @Get('/dashboard/summary')
  getDashboardSumarry(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.getDashboardSumarry(activeRole);
  }

  @Get('/dashboard/category-distribution')
  getCategoryDistribution(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.getCategoryDistribution(activeRole);
  }

  @Get('/dashboard/urgent-repairs')
  getUrgentRepairs(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.getUrgentRepairs(activeRole);
  }

  @Get('/dashboard/organization-tree')
  getOrganizationTree(@ActiveRole() activeRole: JwtRoleClaim) {
    return this.service.organizationTree(activeRole);
  }

  @Get('/institute')
  getAccessibleInstitutions(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryInstitutionDto,
  ) {
    return this.service.findInstitute(activeRole, query);
  }

  @Get('/equipment')
  findEquipment(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryEquipmentDto,
  ) {
    return this.service.findEquipment(activeRole, query);
  }

  @Get('/repair-requests')
  findRepairRequest(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryRepairRequestDto,
  ) {
    return this.service.findRepairRequest(activeRole, query);
  }

  @Get('work-orders')
  async getWorkOrders(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryWorkOrdertDto,
  ) {
    return this.service.findWorkOrders(activeRole, query);
  }

  @Get('inventory-items')
  async getInventoryItems(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryInventoryDto,
  ) {
    return this.service.inventoryItem(activeRole, query);
  }
}



/*import {
  Controller, Get, Headers,
  Query
} from '@nestjs/common';
import { QueryEquipmentDto, QueryInstitutionDto, QueryInventoryDto, QueryRepairRequestDto, QueryWorkOrdertDto } from 'src/dto/index.dto';
import { EquipmentService } from 'src/service/equipment.service';
import { QueryService } from 'src/service/query.service';

@Controller('api')
export class QueryController {
  constructor(private readonly eqService: EquipmentService, private readonly service: QueryService) { }

   @Get('/dashboard/summary')
  getDashboardSumarry(
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    return this.service.getDashboardSumarry(activeRole);
  }

  @Get('/dashboard/category-distribution')
  getCategoryDistribution(
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    return this.service.getCategoryDistribution(activeRole);
  }

  @Get('/dashboard/urgent-repairs')
  getUrgentRepairs(
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    return this.service.getUrgentRepairs(activeRole);
  }

  @Get('/dashboard/organization-tree')
  getOrganizationTree(@Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    return this.service.organizationTree(
      activeRole
    );
  }

  @Get('/institute')
  getAccessibleInstitutions(
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,
    @Query() query: QueryInstitutionDto) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    return this.service.findInstitute(activeRole, query);
  }

  @Get('/equipment')
  findEquipment(
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,
    @Query() query: QueryEquipmentDto) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    //console.log('Query Equipment ', activeRole, query)
    return this.service.findEquipment(activeRole, query);
  }

  @Get('/repair-requests')
  findREpairRequest(
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,
    @Query() query: QueryRepairRequestDto) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    console.log('Query RepairRequestDto ', activeRole, query)
    return this.service.findRepairRequest(activeRole, query);
  }

  @Get('work-orders')
  async getWorkOrders(
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,
    @Query() query: QueryWorkOrdertDto) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    console.log('Query getWorkOrders ', activeRole, query)
    return this.service.findWorkOrders(activeRole, query);
  }

 @Get('inventory-items')
  async getInventoryItems( @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,
    @Query() query: QueryInventoryDto) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    console.log('nventory Item hit', query)
    return this.service.inventoryItem(activeRole,query);
  }

  /*
            // Add Equipment
            @Post('equipment')
            async addEquipment(@Body() data: any) {
              const id = generateId('eq');
              const { components, servicePlan, ...equipmentData } = data;
              console.log("add eqipment ", equipmentData)
              console.log("add eqipment ", components)
              return this.prisma.equipment.create({
                data: {
                  id,
                  ...equipmentData,
                  components: {
                    create: components
                  },
                  servicePlan: servicePlan ? {
                    create: servicePlan
                  } : undefined
                }
              });
            }
          
            // Update Equipment
            @Put('equipment/:id')
            async updateEquipment(@Param('id') id: string, @Body() data: any) {
              const { components, servicePlan, ...equipmentData } = data;
              return this.prisma.equipment.update({
                where: { id },
                data: {
                  ...equipmentData,
                  servicePlan: servicePlan ? {
                    upsert: {
                      create: servicePlan,
                      update: servicePlan
                    }
                  } : undefined
                }
              });
            }
          
            // Assign Equipment
            @Post('equipment/:id/assign')
            async assignEquipment(
              @Param('id') equipmentId: string,
              @Body() body: { toInstitutionId: string; toEntity: 'RDHS' | 'Institution'; quantity: number },
            ) {
              const equipment = await this.prisma.equipment.findUnique({
                where: { id: equipmentId },
                include: { assignedInstitution: true },
              });
              if (!equipment) throw new NotFoundException('Equipment not found');
          
              const institution = await this.prisma.institution.findUnique({
                where: { id: body.toInstitutionId },
              });
              if (!institution) throw new NotFoundException('Institution not found');
          
              const fromEntity = equipment.status === 'PDHS Store' ? 'PDHS' : 'RDHS';
              const assignmentId = generateId('asg');
          
              const assignment = await this.prisma.assignment.create({
                data: {
                  id: assignmentId,
                  equipmentId,
                  fromEntity,
                  toEntity: body.toEntity,
                  toEntityId: body.toInstitutionId,
                  quantity: body.quantity,
                  assignmentDate: new Date(),
                  status: 'Acknowledged',
                },
              });
          
              await this.prisma.equipment.update({
                where: { id: equipmentId },
                data: {
                  status: 'Assigned',
                  assignedInstitutionId: body.toInstitutionId,
                },
              });
          
              return assignment;
            }
      
            */

/*}*/