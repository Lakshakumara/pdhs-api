import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CreateEquipmentDto, UpdateEquipmentDto } from 'src/dto/index.dto';
import { UpsertService } from 'src/service/upsert.service';
import { ActiveRole } from 'src/auth/active.role';
import type { JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { ActiveRoleGuard, JwtAuthGuard } from 'src/auth/auth.guard';

/**
 * See query.controller.ts for the guard-chain rationale. Same pattern
 * here: JwtAuthGuard + ActiveRoleGuard resolve req.activeRole, which
 * @ActiveRole() injects into each handler. Permission checks
 * (PermissionService.require) and scope-restricted lookups
 * (ScopeService.xxxWhere) remain in UpsertService.
 */
@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('api')
export class UpsertController {
  constructor(private readonly service: UpsertService) { }

  // Submit Repair Request
  @Post('repair-requests')
  async submitRepairRequest(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() body: any) {
     console.log('submitRepairRequest called with body:', body); 
    const { equipmentId, componentId, faultDescription, priority, submittedByUserId } = body;
    return this.service.submitRepairRequest(activeRole, equipmentId,
      componentId, faultDescription, priority, submittedByUserId /* submittedByUserId */);
  }

  // Update Work Order Status
  @Put('work-orders/:id/status')
  async updateWorkOrderStatus(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') workOrderId: string,
    @Body() body: { status: string; payload?: any },
  ) {
    console.log('updateWorkOrderStatus called with workOrderId:', workOrderId, 'and body:', body);
    return this.service.updateWorkOrderStatus(activeRole, workOrderId, body);
  }

  @Post('/equipment/add')
  addEquipment(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() data: CreateEquipmentDto,
  ) {
    return this.service.addEquipment(activeRole, data);
  }

  @Put('/equipment/update/:id')
  updateEquipment(
    @Param('id') id: string,
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() data: UpdateEquipmentDto,
  ) {
    return this.service.updateEquipment(activeRole, id, data);
  }

  // Assign Equipment
  @Post('equipment/:id/assign')
  assignEquipment(
    @Param('id') equipmentId: string,
    @ActiveRole() activeRole: JwtRoleClaim,
    @Body() body: { toInstitutionId: string; toEntity: 'RDHS' | 'Institution'; quantity: number },
  ) {
    return this.service.assignEquipment(
      activeRole,
      equipmentId,
      body.toInstitutionId,
      body.toEntity,
      body.quantity,
    );
  }
}



/*import { Body, Controller, Headers, Param, Post, Put } from '@nestjs/common';
import { CreateEquipmentDto, UpdateEquipmentDto } from 'src/dto/index.dto';
import { UpsertService } from 'src/service/upsert.service';

@Controller('api')
export class UpsertController {
  constructor(private readonly service: UpsertService) { }

// Update Work Order Status
  @Put('work-orders/:id/status')
  async updateWorkOrderStatus(
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,
    @Param('id') workOrderId: string,
    @Body() body: { status: string; payload?: any },
  ) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    return this.service.updateWorkOrderStatus(activeRole,workOrderId, body);
  }

  @Post('/equipment/add')
  addEquipment(
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,
    @Body() data: CreateEquipmentDto) {
    console.log('/equipment/add called')
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    console.log('Query Equipment ', activeRole, data)
    return this.service.addEquipment(activeRole, data);
  }

  @Put('/equipment/update/:id')
  updateEquipment(
    @Param('id') id: string,
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,
    @Body() data: UpdateEquipmentDto) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    console.log('Query Equipment ', activeRole, data)
    return this.service.updateEquipment(activeRole, id, data);
  }

  // Assign Equipment
  @Post('equipment/:id/assign')
  assignEquipment(
    @Param('id') equipmentId: string,
    @Headers('x-role') role: string,
    @Headers('x-scope-type') scopeType: string,
    @Headers('x-scope-id') scopeId: string,
    @Body() body: { toInstitutionId: string; toEntity: 'RDHS' | 'Institution'; quantity: number },
  ) {
    const activeRole = {
      role,
      scopeType,
      scopeId
    };
    return this.service.assignEquipment(activeRole,
      equipmentId,
      body.toInstitutionId,
      body.toEntity, body.quantity);
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