import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryUsersDto } from './dto/user.dto';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

@Controller('api/developer')
export class DeveloperController {
  constructor(private prisma: PrismaService) { }

  // Users
  @Get('users')
  async getUsers(
    @Query() query: QueryUsersDto
  ) {
    const where ={}
    const skip = (query.page - 1) * query.size;
     const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: query.size,
        select: this.userSelect,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map(u => this.mapUser(u)),
      page: query.page,
      size: query.size,
      total,
      totalPages: Math.ceil(total / query.size),
    };
  }

  private get userSelect() {
    return {
      id: true,
      username: true,
      fullName: true,
      email: true,
      active: true,
      mustChangePassword: true,
      institutionId: true,
      createdAt: true,
      updatedAt: true,
      institution: {
        select: {
          id: true, name: true,
          districtId: true,
          district: { select: { id: true, name: true } },
        },
      },
      roles: {
        select: {
          id: true, role: true, scopeType: true,
          scopeId: true, assignedAt: true,
          assignedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { assignedAt: 'asc' as const },
      },
      permissions: {
        select: {
          id: true, permission: true, grantedAt: true,
          expiresAt: true, note: true,
          grantedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { grantedAt: 'asc' as const },
      },
    };
  }

  private mapUser(user: any) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      active: user.active,
      mustChangePassword: user.mustChangePassword,
      institutionId: user.institutionId,
      institutionName: user.institution?.name ?? null,
      districtId: user.institution?.districtId ?? null,
      districtName: user.institution?.district?.name ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}