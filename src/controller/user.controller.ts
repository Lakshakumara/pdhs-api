import {
  Controller, Get, Post, Patch, Delete, Put,
  Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from 'src/service/user.service';
import type { JwtPayload, JwtRoleClaim } from 'src/auth/jwt-payload.interface';
import { PermissionService } from 'src/auth/permission.service';
import { Permission } from 'src/auth/permission.enum';
import { ActiveRoleGuard, JwtAuthGuard } from 'src/common/guard/auth.guard';
import { AddRoleDto, CreateUserDto, GrantPermissionDto, QueryUsersDto, UpdateUserDto } from 'src/dto/index.dto';
import { ActiveRole } from 'src/common/decorators/active-role.decorator';
import { PermissionGuard } from 'src/common/guard/permission-guard';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { SkipPermission } from 'src/common/decorators/skip-permission.decorator';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api/users')
export class UsersController {

  constructor(
    private readonly usersService: UsersService,
    private readonly permissionService: PermissionService,
  ) { }

  // ── GET /api/users/me ──────────────────────────────────────────────
  // No permission check — every authenticated user can fetch their own
  // profile. ActiveRoleGuard still runs to populate req.activeRole.
  @Get('me')
  @SkipPermission()
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.getUserById(req.user.sub);
  }

  // ── GET /api/users ─────────────────────────────────────────────────
  @Get()
  @RequirePermission(Permission.USER_VIEW)
  async findAll(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Query() query: QueryUsersDto,) {
    return this.usersService.findAll(activeRole, query);
  }

  // ── GET /api/users/:id ─────────────────────────────────────────────
  @Get(':id')
  @RequirePermission(Permission.USER_VIEW)
  async findOne(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,) {
    return this.usersService.getUserById(id);
  }

  // ── POST /api/users ────────────────────────────────────────────────
  @Post()
  @RequirePermission(Permission.USER_CREATE)
  async create(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Req() req: Request,
    @Body() dto: CreateUserDto,) {
    return this.usersService.createUser(activeRole, req.user!.sub, dto);
  }

  // ── PATCH /api/users/:id ───────────────────────────────────────────
  @Patch(':id')
  @RequirePermission(Permission.USER_UPDATE)
  async update(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,) {
    return this.usersService.updateUser(activeRole, id, dto);
  }

  // ── DELETE /api/users/:id ──────────────────────────────────────────
  @Delete(':id')
  @RequirePermission(Permission.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,
  ) {
    return this.usersService.deleteUser(activeRole, id);
  }

  // ── POST /api/users/:id/reset-password ────────────────────────────
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipPermission()
  async resetPassword(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,) {
    return this.usersService.resetPassword(activeRole, id);
  }

  // ── PATCH /api/users/:id/active ────────────────────────────────────
  @Patch(':id/active')
  @RequirePermission(Permission.USER_UPDATE)
  async toggleActive(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,
    @Body() body: { active: boolean },) {
    return this.usersService.setActive(activeRole, id, body.active);
  }

  // ══════════════════════════════════════════════════════════════════
  // ROLE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════

  // ── POST /api/users/:id/roles ──────────────────────────────────────
  @Post(':id/roles')
  @RequirePermission(Permission.USER_CREATE)
  async addRole(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Req() req: Request,
    @Param('id') userId: string,
    @Body() dto: AddRoleDto,) {
    return this.usersService.addRole(activeRole, req.user!.sub, userId, dto);
  }

  // ── DELETE /api/users/:id/roles/:roleId ───────────────────────────
  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Permission.USER_DELETE)
  async removeRole(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.usersService.removeRole(activeRole, userId, roleId);
  }

  // ══════════════════════════════════════════════════════════════════
  // PERMISSION MANAGEMENT
  // ══════════════════════════════════════════════════════════════════

  // ── GET /api/users/:id/permissions ────────────────────────────────
  @Get(':id/permissions')
  @RequirePermission(Permission.PERMISSION_VIEW)
  async getPermissions(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') userId: string,
  ) {
    return this.usersService.getPermissions(userId);
  }

  // ── POST /api/users/:id/permissions ───────────────────────────────
  // Grant a single permission (optionally with expiry + note)
  @Post(':id/permissions')
  @RequirePermission(Permission.PERMISSION_CREATE)
  async grantPermission(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Req() req: Request,
    @Param('id') userId: string,
    @Body() dto: GrantPermissionDto,
  ) {
    return this.usersService.grantPermission(activeRole, req.user!.sub, userId, dto);
  }

  // ── DELETE /api/users/:id/permissions/:permissionId ───────────────
  @Delete(':id/permissions/:permissionId')
  @RequirePermission(Permission.PERMISSION_REMOVE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokePermission(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') userId: string,
    @Param('permissionId') permissionId: string,
  ) {
    this.permissionService.require(activeRole.role, Permission.USER_UPDATE);
    return this.usersService.revokePermission(activeRole, userId, permissionId);
  }

  // ── PUT /api/users/:id/permissions ────────────────────────────────
  // Bulk-sync all permissions for a user (replaces the entire set)
  @Put(':id/permissions')
  //@SkipPermission()
  @RequirePermission(Permission.PERMISSION_CREATE)
  async syncPermissions(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Req() req: Request,
    @Param('id') userId: string,
    @Body() body: { permissions: string[] },) {
    return this.usersService.syncPermissions(activeRole, req.user!.sub, userId, body.permissions);
  }
}
