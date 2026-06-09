import {
  Controller, Get, Headers,
  Query
} from '@nestjs/common';
import { QueryEquipmentDto, QueryInstitutionDto } from 'src/dto/index.dto';
import { EquipmentService } from 'src/service/equipment.service';
import { QueryService } from 'src/service/query.service';

@Controller('api')
export class QueryController {
  constructor(private readonly eqService: EquipmentService, private readonly service: QueryService) { }

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
        console.log('Query  Institute', activeRole, query)
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
    console.log('Query Equipment ', activeRole, query)
    return this.service.findEquipment(activeRole, query);
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

}