
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { BiomedicalStateController } from './biomedical-state.controller';
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

@Module({
  imports: [ConfigModule.forRoot(
    {isGlobal: true,}),
  ],
  controllers: [
    UsersController,
    BiomedicalStateController, 
    QueryController, 
    UpsertController],
  providers: [
    UsersService,
    PrismaQueryBuilder_v1, 
    PermissionService, 
    ScopeService,  
    PrismaService,
    EquipmentService,
    QueryService,
    UpsertService],
})
export class AppModule {}
