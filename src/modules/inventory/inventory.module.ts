import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';

@Module({
  imports: [AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaQueryBuilder],
  exports: [InventoryService],
})
export class InventoryModule {}
