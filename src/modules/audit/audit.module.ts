import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';

@Module({
  // forwardRef: AuthModule also imports AuditModule (auth-event auditing).
  imports: [forwardRef(() => AuthModule)],
  controllers: [AuditController],
  providers: [AuditService, PrismaQueryBuilder],
  exports: [AuditService],
})
export class AuditModule {}
