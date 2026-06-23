import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { UsersController } from './controller/user.controller';
import { UsersService } from './service/user.service';
import { EquipmentService } from './service/equipment.service';
import { QueryController } from './controller/query.controller';
import { PermissionService } from './auth/permission.service';
import { ScopeService } from './auth/scope.service';
import { QueryService } from './service/query.service';
import { PrismaQueryBuilder_v1 } from './prismaQueryBuilder-v1';
import { UpsertController } from './controller/upsert.controller';
import { UpsertService } from './service/upsert.service';
import { AuthModule } from './auth/auth.module';
import { BiomedicalStateController } from './biomedical-state.controller';
import { IdService } from './service/id.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,   // <- new: global PrismaService, see prisma.module.ts
    AuthModule,
  ],
  controllers: [
    UsersController,
    QueryController,
    UpsertController,
    BiomedicalStateController,
  ],
  providers: [
    IdService,
    UsersService,
    PrismaQueryBuilder_v1,
    PermissionService,
    ScopeService,
    EquipmentService,
    QueryService,
    UpsertService,
  ],
})
export class AppModule {}
