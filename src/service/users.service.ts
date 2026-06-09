/*import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ScopeType, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { randomBytes } from 'crypto';
import { CreateUserDto, UpdateUserDto } from 'src/dto/index.dto';
import { PrismaService } from 'src/prisma.service';

const BCRYPT_ROUNDS = 12;

// Fields selected for list and detail responses
const USER_SELECT = {
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
      id: true,
      name: true,
      districtId: true,
      district: { select: { id: true, name: true } },
    },
  },
  roles: {
    select: {
      id: true,
      role: true,
      scopeType: true,
      scopeId: true,
      assignedAt: true,
      assignedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { assignedAt: 'asc' as const },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ────────────────────────────────────────────
  // READ
  // ────────────────────────────────────────────

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const users = await this.prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return users.map(this.mapUser);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.mapUser(user);
  }

  // ────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────

  async create(dto: CreateUserDto) {
    // Check uniqueness
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });
    if (existing) {
      if (existing.username === dto.username)
        throw new ConflictException('Username already taken');
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const userId = randomUUID();

    const user = await this.prisma.user.create({
      data: {
        id: userId,
        username: dto.username,
        fullName: dto.fullName,
        email: dto.email ?? null,
        passwordHash,
        institutionId: dto.institutionId ?? null,
        mustChangePassword: dto.mustChangePassword ?? true,
        roles: {
          create: dto.roles.map(r => ({
            id: randomUUID(),
            role: r.role as RoleType,
            scopeType: r.scopeType as ScopeType,
            scopeId: r.scopeId ?? null,
          })),
        },
      },
      select: USER_SELECT,
    });

    return this.mapUser(user);
  }

  // ────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // 404 guard

    // Email uniqueness check (if changing)
    if (dto.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (conflict) throw new ConflictException('Email already in use');
    }

    const updateData: any = {
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.email !== undefined && { email: dto.email || null }),
      ...(dto.active !== undefined && { active: dto.active }),
      ...(dto.institutionId !== undefined && { institutionId: dto.institutionId || null }),
      ...(dto.mustChangePassword !== undefined && { mustChangePassword: dto.mustChangePassword }),
    };

    if ((dto as any).password) {
      updateData.passwordHash = await bcrypt.hash((dto as any).password, BCRYPT_ROUNDS);
    }

    // Re-sync roles: delete all, recreate
    if (dto.roles !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      updateData.roles = {
        create: dto.roles.map(r => ({
          id: randomUUID(),
          role: r.role as RoleType,
          scopeType: r.scopeType as ScopeType,
          scopeId: r.scopeId ?? null,
        })),
      };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    return this.mapUser(user);
  }

  // ────────────────────────────────────────────
  // DELETE
  // ────────────────────────────────────────────

  async remove(id: string) {
    await this.findOne(id); // 404 guard
    await this.prisma.user.delete({ where: { id } });
  }

  // ────────────────────────────────────────────
  // PASSWORD RESET TRIGGER
  // ────────────────────────────────────────────

  async triggerPasswordReset(id: string) {
    const user = await this.findOne(id);

    // Invalidate any existing tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.passwordResetToken.create({
      data: {
        id: randomUUID(),
        token,
        userId: id,
        expiresAt,
      },
    });

    // TODO: inject MailService and send actual email
    // await this.mailService.sendPasswordReset(user.email, token);

    return { message: 'Password reset token created', expiresAt };
  }

  // ────────────────────────────────────────────
  // MAPPER
  // ────────────────────────────────────────────

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
      roles: user.roles.map((r: any) => ({
        id: r.id,
        role: r.role,
        scopeType: r.scopeType,
        scopeId: r.scopeId,
        assignedAt: r.assignedAt,
        assignedBy: r.assignedBy ?? null,
      })),
    };
  }
}
*/