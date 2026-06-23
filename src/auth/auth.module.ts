import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma.module';
import { JwtAuthGuard, ActiveRoleGuard } from '../common/guard/auth.guard';
import { PermissionGuard } from 'src/common/guard/permission-guard';

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
          // @nestjs/jwt types `expiresIn` as `number | StringValue` (a
          // narrow template-literal type from the `ms` package), but
          // ConfigService.get<string>() returns a plain `string`.
          // '8h', '60m', '1d' etc. are all valid StringValue formats —
          // only the TS type is too narrow to accept a generic string,
          // hence the cast.
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, ActiveRoleGuard, PermissionGuard],
  // Exported so other feature modules can use these guards in their own
  // @UseGuards(...) without re-declaring them as providers.
  exports: [AuthService, JwtAuthGuard, ActiveRoleGuard, PermissionGuard],
})
export class AuthModule {}
