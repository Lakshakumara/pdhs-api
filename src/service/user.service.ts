// users.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class UsersService {

  constructor(private readonly prisma: PrismaService) {}

  async getUserById(userId: string): Promise<UserDto> {

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        institution: {
          include: {
            district: true
          }
        },
        roles: true
      }
    });

    if (!user) {
      throw new NotFoundException(
        `User ${userId} not found`
      );
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,

      active: user.active,
      mustChangePassword: user.mustChangePassword,

      institutionId: user.institution?.id ?? null,
      institutionName: user.institution?.name ?? null,

      districtId: user.institution?.district?.id ?? null,
      districtName: user.institution?.district?.name ?? null,

      roles: user.roles.map(role => ({
        id: role.id,
        role: role.role,
        scopeType: role.scopeType,
        scopeId: role.scopeId,
        assignedAt: role.assignedAt,
        assignedById: role.assignedById
      }))
    };
  }
  /*
  @Get()
async getUsers(
  @Req() req
) {

  const activeRole =
    req.user.activeRole;

  this.permissionService.require(
    activeRole.role,
    Permission.USER_VIEW
  );

  const where =
    this.scopeService.userWhere(
      activeRole
    );

  return this.prisma.user.findMany({
    where
  });
}*/
}