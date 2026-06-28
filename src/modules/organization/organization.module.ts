import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, PrismaQueryBuilder],
  exports: [OrganizationService],
})
export class OrganizationModule {}
