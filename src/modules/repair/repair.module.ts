import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { IdModule } from '../../shared/id/id.module';
import { RepairController } from './repair.controller';
import { RepairService } from './repair.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';

@Module({
  imports: [AuthModule, PrismaModule, IdModule],
  controllers: [RepairController],
  providers: [RepairService, PrismaQueryBuilder],
  exports: [RepairService],
})
export class RepairModule {}
