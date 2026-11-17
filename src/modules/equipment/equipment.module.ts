import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { IdModule } from '../../shared/id/id.module';
import { AuditModule } from '../audit/audit.module';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';

@Module({
  imports: [AuthModule, PrismaModule, IdModule, AuditModule],
  controllers: [EquipmentController],
  providers: [EquipmentService, PrismaQueryBuilder],
  exports: [EquipmentService],
})
export class EquipmentModule {}
