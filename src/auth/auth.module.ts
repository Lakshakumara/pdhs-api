import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard, ActiveRoleGuard } from '../common/guards/auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { PermissionService } from './permission.service';
import { ScopeService } from './scope.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.get<string>('JWT_SECRET', 'soft_solution_software_@_laksha_@_1227'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    ActiveRoleGuard,
    PermissionGuard,
    PermissionService,
    ScopeService,
  ],
  // Exported so feature modules can use guards + services via injection
  // without re-declaring them as providers.
  exports: [
    AuthService,
    JwtAuthGuard,
    ActiveRoleGuard,
    PermissionGuard,
    PermissionService,
    ScopeService,
  ],
})
export class AuthModule {}
