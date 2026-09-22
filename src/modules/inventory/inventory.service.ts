import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaQueryBuilder } from '../../prisma/prisma-query-builder';
import { JwtRoleClaim } from '../../auth/jwt-payload.interface';
import { QueryInventoryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBuilder: PrismaQueryBuilder,
  ) {}

  async findInventoryItems(activeRole: JwtRoleClaim, query: QueryInventoryDto) {
    const { where, skip, take, page, size } = this.queryBuilder.build(
      query,
      {},
      ['name', 'category'],
      [],
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: size,
        orderBy: { name: 'asc' },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return convertDecimals({
      items,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    });
  }
}

function convertDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Decimal) return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertDecimals);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, convertDecimals(v)]),
    );
  }
  return obj;
}
