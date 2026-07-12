import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { RepairModule } from './modules/repair/repair.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AuditModule } from './modules/audit/audit.module';
import { InstituteModule } from './modules/institute/institute.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    InstituteModule,
    EquipmentModule,
    RepairModule,
    OrganizationModule,
    DashboardModule,
    InventoryModule,
    AuditModule,
  ],
})
export class AppModule {}
