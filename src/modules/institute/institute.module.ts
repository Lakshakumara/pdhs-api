import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { InstituteService } from './institute.service';
import {
  DistrictController,
  InstituteController,
} from './institute.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [InstituteController, DistrictController],
  providers: [InstituteService],
  exports: [InstituteService],
})
export class InstituteModule {}
