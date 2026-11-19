import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import type {
  JwtPayload,
  JwtRoleClaim,
} from '../../auth/jwt-payload.interface';
import { PermissionService } from '../../auth/permission.service';
import { Permission } from '../../auth/permission.enum';
import { JwtAuthGuard, ActiveRoleGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ActiveRole } from '../../common/decorators/active-role.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { SkipPermission } from '../../common/decorators/skip-permission.decorator';
import {
  AddRoleDto,
  CreateUserDto,
  GrantPermissionDto,
  QueryUsersDto,
  UpdateUserDto,
} from './dto/user.dto';
import { buildAuditContext } from '../../common/utils/audit-context.util';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@UseGuards(JwtAuthGuard, ActiveRoleGuard, PermissionGuard)
@Controller('api/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionService: PermissionService,
  ) {}

  // ── GET /api/users/me ──────────────────────────────────────────────
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
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.findAll(activeRole, query);
  }

  // ── GET /api/users/:id ─────────────────────────────────────────────
  @Get(':id')
  @RequirePermission(Permission.USER_VIEW)
  async findOne(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,
  ) {
    return this.usersService.getUserById(id);
  }

  // ── POST /api/users ────────────────────────────────────────────────
  @Post()
  @RequirePermission(Permission.USER_CREATE)
  async create(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Req() req: Request,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createUser(
      activeRole,
      (req.user as JwtPayload).sub,
      dto,
      buildAuditContext(req),    );
  }

  // ── PATCH /api/users/:id ───────────────────────────────────────────
  @Patch(':id')
  @RequirePermission(Permission.USER_UPDATE)
  async update(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,  ) {
    return this.usersService.updateUser(activeRole, id, dto, buildAuditContext(req));
  }

  // ── DELETE /api/users/:id ──────────────────────────────────────────
  @Delete(':id')
  @RequirePermission(Permission.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,
    @Req() req: Request,  ) {
    return this.usersService.deleteUser(activeRole, id, buildAuditContext(req));
  }

  // ── POST /api/users/:id/reset-password ────────────────────────────
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Permission.USER_UPDATE)
  async resetPassword(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,
    @Req() req: Request,  ) {
    return this.usersService.resetPassword(activeRole, id, buildAuditContext(req));
  }

  // ── PATCH /api/users/:id/active ────────────────────────────────────
  @Patch(':id/active')
  @RequirePermission(Permission.USER_UPDATE)
  async toggleActive(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') id: string,
    @Body() body: { active: boolean },
    @Req() req: Request,  ) {
    return this.usersService.setActive(activeRole, id, body.active, buildAuditContext(req));
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
    @Body() dto: AddRoleDto,
  ) {
    return this.usersService.addRole(
      activeRole,
      (req.user as JwtPayload).sub,
      userId,
      dto,
      buildAuditContext(req),    );
  }

  // ── DELETE /api/users/:id/roles/:roleId ───────────────────────────
  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Permission.USER_DELETE)
  async removeRole(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
    @Req() req: Request,  ) {
    return this.usersService.removeRole(activeRole, userId, roleId, buildAuditContext(req));
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
  @Post(':id/permissions')
  @RequirePermission(Permission.PERMISSION_CREATE)
  async grantPermission(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Req() req: Request,
    @Param('id') userId: string,
    @Body() dto: GrantPermissionDto,
  ) {
    return this.usersService.grantPermission(
      activeRole,
      (req.user as JwtPayload).sub,
      userId,
      dto,
      buildAuditContext(req),    );
  }

  // ── DELETE /api/users/:id/permissions/:permissionId ───────────────
  @Delete(':id/permissions/:permissionId')
  @RequirePermission(Permission.PERMISSION_REMOVE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokePermission(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Param('id') userId: string,
    @Param('permissionId') permissionId: string,
    @Req() req: Request,  ) {
    return this.usersService.revokePermission(
      activeRole,
      userId,
      permissionId,
      buildAuditContext(req),    );
  }

  // ── PUT /api/users/:id/permissions ────────────────────────────────
  @Put(':id/permissions')
  @RequirePermission(Permission.PERMISSION_CREATE)
  async syncPermissions(
    @ActiveRole() activeRole: JwtRoleClaim,
    @Req() req: Request,
    @Param('id') userId: string,
    @Body() body: { permissions: string[] },
  ) {
    return this.usersService.syncPermissions(
      activeRole,
      (req.user as JwtPayload).sub,
      userId,
      body.permissions,
      buildAuditContext(req),    );
  }
}
