import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Wraps your existing PrismaService (src/prisma.service.ts) so it can be
 * shared as a single instance across AppModule, AuthModule, and any other
 * feature modules — without each module spinning up its own PrismaClient
 * connection pool.
 *
 * @Global() means once this is imported ONCE (in AppModule), PrismaService
 * is injectable anywhere else without re-importing PrismaModule.
 *
 * IMPORTANT: remove `PrismaService` from AppModule's own `providers` array
 * (see app.module.ts below) — otherwise Nest creates TWO separate
 * PrismaService instances (one here, one there), defeating the point and
 * potentially opening two DB connection pools.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
