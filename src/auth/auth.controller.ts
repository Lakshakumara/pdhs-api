import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './auth.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import type { JwtPayload } from './jwt-payload.interface';
  import { PERMISSION_GROUPS, PERMISSIONS } from './constants/permission.registry';
import { Permission } from './permission.enum';
import { SkipPermission } from 'src/common/decorators/skip-permission.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


@Get('permissions/meta')
@SkipPermission()
getPermissionMeta() {
  return {
    groups: PERMISSION_GROUPS,
    definitions: PERMISSIONS,
  };
}
  // ───────────────────────────────────────────────────────────────────
  // POST /api/auth/login
  // Body: { username, password }
  // Returns: { token, refreshToken, user }
  //
  // `token` is the short-lived access token (default 8h) — this is what
  // the frontend stores as `auth_token` and sends as `Authorization:
  // Bearer <token>`.
  //
  // `refreshToken` (7d) isn't used by the current frontend yet — it's
  // here so a refresh flow can be wired in later without another
  // backend change. Safe to ignore in the response for now.
  // ───────────────────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto.username, dto.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // POST /api/auth/refresh
  // Body: { refreshToken }
  // Returns: { token, refreshToken }  (refresh token is ROTATED)
  // ───────────────────────────────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshTokens(dto.refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // POST /api/auth/logout
  // Body: { refreshToken }
  // Revokes the supplied refresh token. Requires a valid access token
  // (so an attacker can't blindly revoke arbitrary tokens).
  // ───────────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
  }

  // ───────────────────────────────────────────────────────────────────
  // POST /api/auth/logout-all
  // Revokes ALL refresh tokens for the authenticated user
  // (e.g. "sign out of all devices" / after a password change).
  // ───────────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@Req() req: Request) {
    await this.authService.logoutAllDevices((req.user as JwtPayload).sub);
  }

  // ───────────────────────────────────────────────────────────────────
  // POST /api/auth/change-password
  // Body: { currentPassword, newPassword }
  // For an authenticated user changing their own password
  // (also clears `mustChangePassword`).
  // ───────────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(
      (req.user as JwtPayload).sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // ───────────────────────────────────────────────────────────────────
  // POST /api/auth/forgot-password
  // Body: { email }
  // Always returns 200 regardless of whether the email exists.
  // ───────────────────────────────────────────────────────────────────
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If that email exists, a password reset link has been sent.' };
  }

  // ───────────────────────────────────────────────────────────────────
  // POST /api/auth/reset-password
  // Body: { token, newPassword }
  // Completes a self-service reset using the token emailed via
  // forgot-password.
  // ───────────────────────────────────────────────────────────────────
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
