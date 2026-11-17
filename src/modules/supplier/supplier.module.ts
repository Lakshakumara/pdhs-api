import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { IdModule } from '../../shared/id/id.module';
import { AuditModule } from '../audit/audit.module';
import { SuppliersController } from './suppliers.controller';
import { SupplierService } from './supplier.service';

@Module({
  imports: [AuthModule, PrismaModule, IdModule, AuditModule],
  controllers: [SuppliersController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}
