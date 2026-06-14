import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    // 1. Fetch user from DB with roles and institution context
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        institution: {
          include: {
            district: true,
          },
        },
        roles: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.active) {
      throw new UnauthorizedException('Account is disabled');
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // 3. Format roles in UserDto structure
    const roles = user.roles.map((role) => ({
      id: role.id,
      role: role.role,
      scopeType: role.scopeType,
      scopeId: role.scopeId,
      assignedAt: role.assignedAt,
      assignedById: role.assignedById,
    }));

    const userDto = {
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
      roles,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    // 4. Generate JWT payload
    // Include user details and active role context
    const payload = {
      sub: user.id,
      username: user.username,
      roles: roles.map(r => ({ role: r.role, scopeType: r.scopeType, scopeId: r.scopeId })),
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: userDto,
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
