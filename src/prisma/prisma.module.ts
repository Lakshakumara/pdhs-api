import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global Prisma module — wraps PrismaService so it can be shared as a
 * single instance across all feature modules without each one importing
 * PrismaModule individually.
 *
 * @Global() means once this is imported in AppModule, PrismaService is
 * injectable everywhere without re-importing PrismaModule.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
