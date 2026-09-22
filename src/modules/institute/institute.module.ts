import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { InstituteService } from './institute.service';
import { InstituteController, } from './institute.controller';

@Module({
  imports: [AuthModule],
  controllers: [InstituteController],
  providers: [InstituteService, PrismaQueryBuilder],
  exports: [InstituteService],
})
export class InstituteModule {}
