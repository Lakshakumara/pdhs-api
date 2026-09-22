import { Global, Module } from '@nestjs/common';
import { IdService } from './id.service';

/**
 * Global module so any feature module can inject IdService without
 * needing to import IdModule themselves.
 */
@Global()
@Module({
  providers: [IdService],
  exports: [IdService],
})
export class IdModule {}
